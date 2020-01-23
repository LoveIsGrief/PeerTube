#!/bin/bash
# Required environment vars
# =========================
# API_LANGS
#   A ':' delimited list of the client lib languages to be generated
# API_GIT_USER
#   The git username
# API_REPO
#   The repository name
# GIT_TOKEN
#   A personal access token for github or gilab for pushing to repos
#   !!!This is a secret and shouldn't be logged publicly!!!

# (Optional environment vars)
# ===========================
# API_COMMIT_MSG
#   A message to use when committing to the lib repo
# API_REPO_HOST
#   Whoever's hosting the repo e.g gitlab.com, github.com, etc.
#   Default: framagit.org

# Unofficial bash strict mode
# https://web.archive.org/web/20190115051613/https://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euvo pipefail
IFS=$'\n\t '

for lang in ${API_LANGS//:/ } ; do
(
    echo "Generating client API libs for $lang"

    out_repo="dist/api/${API_REPO}"
    out_dir="${out_repo}/${lang}"
    host_path="${API_REPO_HOST:framagit.org}/${API_GIT_USER}/${API_REPO}.git"
    git_remote="https://${API_GIT_USER}:${GIT_TOKEN}@${host_path}"
    if ! [ -e "$out_repo" ] ; then
        git clone "https://${host_path}" "$out_repo"
    fi

    docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate \
        -i /local/support/doc/api/openapi.yaml \
        -c "/local/openapi/${lang}.yaml" \
        -g "$lang" \
        --git-user-id "${API_GIT_USER}" \
        --git-repo-id "${repo_id}" \
        -o "/local/${out_dir}"

    # Docker uses root so we need to undo that
    sudo chown -R `id -u` "$out_repo"

    # Commit and push changes to the remote
    cd "$out_repo"
    git remote set-url origin "$git_remote"
    # Make sure something has changed
    if [[ `git status -s | wc -l` = 0 ]] ; then
        echo "No changes from previous version"
        continue
    fi
    git add .
    git commit -m "${API_COMMIT_MSG:-"Minor update $lang"}"
    git push
)
done
