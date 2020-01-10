import { catchError, map } from 'rxjs/operators'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { RestExtractor, RestPagination, RestService } from '@app/shared'
import { environment } from '../../../../environments/environment'
import { SortMeta } from 'primeng/api'
import { ActivityPubActorType, ActorFollow, FollowState, ResultList, VideoRedundanciesTarget, VideoRedundancy } from '@shared/models'
import { Observable } from 'rxjs'

@Injectable()
export class RedundancyService {
  static BASE_REDUNDANCY_URL = environment.apiUrl + '/api/v1/server/redundancy'

  constructor (
    private authHttp: HttpClient,
    private restService: RestService,
    private restExtractor: RestExtractor
  ) { }

  updateRedundancy (host: string, redundancyAllowed: boolean) {
    const url = RedundancyService.BASE_REDUNDANCY_URL + '/' + host

    const body = { redundancyAllowed }

    return this.authHttp.put(url, body)
               .pipe(
                 map(this.restExtractor.extractDataBool),
                 catchError(err => this.restExtractor.handleError(err))
               )
  }

  listVideoRedundancies (options: {
    pagination: RestPagination,
    sort: SortMeta,
    target?: VideoRedundanciesTarget
  }): Observable<ResultList<VideoRedundancy>> {
    const { pagination, sort, target } = options

    let params = new HttpParams()
    params = this.restService.addRestGetParams(params, pagination, sort)

    if (target) params = params.append('target', target)

    return this.authHttp.get<ResultList<VideoRedundancy>>(RedundancyService.BASE_REDUNDANCY_URL + '/videos', { params })
               .pipe(
                 catchError(res => this.restExtractor.handleError(res))
               )
  }
}
