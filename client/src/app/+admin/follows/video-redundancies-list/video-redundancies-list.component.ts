import { Component, OnInit } from '@angular/core'
import { Notifier, ServerService } from '@app/core'
import { SortMeta } from 'primeng/api'
import { ConfirmService } from '../../../core/confirm/confirm.service'
import { RestPagination, RestTable } from '../../../shared'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { RedundancyService } from '@app/+admin/follows/shared/redundancy.service'
import { VideoRedundanciesTarget, VideoRedundancy } from '@shared/models'
import { peertubeLocalStorage } from '@app/shared/misc/peertube-web-storage'
import { ServerStats, VideosRedundancyStats } from '@shared/models/server'
import { BytesPipe } from 'ngx-pipes'

@Component({
  selector: 'my-video-redundancies-list',
  templateUrl: './video-redundancies-list.component.html',
  styleUrls: [ './video-redundancies-list.component.scss' ]
})
export class VideoRedundanciesListComponent extends RestTable implements OnInit {
  private static LOCAL_STORAGE_DISPLAY_TYPE = 'video-redundancies-list-display-type'

  videoRedundancies: VideoRedundancy[] = []
  totalRecords = 0
  rowsPerPage = 10

  sort: SortMeta = { field: 'name', order: 1 }
  pagination: RestPagination = { count: this.rowsPerPage, start: 0 }
  displayType: VideoRedundanciesTarget = 'my-videos'

  redundanciesGraphsData: { stats: VideosRedundancyStats, graphData: object, options: object }[] = []

  private bytesPipe: BytesPipe

  constructor (
    private notifier: Notifier,
    private confirmService: ConfirmService,
    private redundancyService: RedundancyService,
    private serverService: ServerService,
    private i18n: I18n
  ) {
    super()

    this.bytesPipe = new BytesPipe()
  }

  ngOnInit () {
    this.loadSelectLocalStorage()

    this.initialize()

    this.serverService.getServerStats()
        .subscribe(res => {
          for (const r of res.videosRedundancy) {
            this.buildPieData(r)
          }
        })
  }

  getTotalSize (redundancy: VideoRedundancy) {
    return redundancy.redundancies.files.reduce((a, b) => a + b.size, 0) +
      redundancy.redundancies.streamingPlaylists.reduce((a, b) => a + b.size, 0)
  }

  onDisplayTypeChanged () {
    this.pagination.start = 0
    this.saveSelectLocalStorage()

    this.loadData()
  }

  buildPieData (stats: VideosRedundancyStats) {
    this.redundanciesGraphsData.push({
      stats: stats,
      graphData: {
        labels: [ this.i18n('Used'), this.i18n('Available') ],
        datasets: [
          {
            data: [ stats.totalUsed, stats.totalSize - stats.totalUsed ],
            backgroundColor: [
              '#FF6384',
              '#36A2EB'
            ],
            hoverBackgroundColor: [
              '#FF6384',
              '#36A2EB'
            ]
          }
        ]
      },
      options: {
        title: {
          display: true,
          text: stats.strategy
        },

        tooltips: {
          callbacks: {
            label: (tooltipItem: any, data: any) => {
              const dataset = data.datasets[tooltipItem.datasetIndex]
              let label = data.labels[tooltipItem.index]

              if (label) label += ': '

              console.log(dataset.data[tooltipItem.index])
              label += this.bytesPipe.transform(dataset.data[tooltipItem.index], 1)
              return label
            }
          }
        }
      }
    })
  }

  protected loadData () {
    const options = {
      pagination: this.pagination,
      sort: this.sort,
      target: this.displayType
    }

    this.redundancyService.listVideoRedundancies(options)
                      .subscribe(
                        resultList => {
                          this.videoRedundancies = resultList.data
                          this.totalRecords = resultList.total
                        },

                        err => this.notifier.error(err.message)
                      )
  }

  private loadSelectLocalStorage () {
    const displayType = peertubeLocalStorage.getItem(VideoRedundanciesListComponent.LOCAL_STORAGE_DISPLAY_TYPE)
    if (displayType) this.displayType = displayType as VideoRedundanciesTarget
  }

  private saveSelectLocalStorage () {
    peertubeLocalStorage.setItem(VideoRedundanciesListComponent.LOCAL_STORAGE_DISPLAY_TYPE, this.displayType)
  }
}
