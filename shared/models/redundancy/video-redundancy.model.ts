export interface VideoRedundancy {
  id: number
  name: string
  url: string

  redundancies: {
    files: FileRedundancyInformation[]

    streamingPlaylists: StreamingPlaylistRedundancyInformation[]
  }
}

interface RedundancyInformation {
  fileUrl: string
  strategy: string

  createdAt: Date | string
  updatedAt: Date | string

  expiresOn: Date | string

  size: number
}

export interface FileRedundancyInformation extends RedundancyInformation {

}

export interface StreamingPlaylistRedundancyInformation extends RedundancyInformation {

}
