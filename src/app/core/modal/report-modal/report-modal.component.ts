import { Component, Inject } from '@angular/core';
import { PicturePublication, PostPublication, VideoPublication } from '../../models/publication/feed/feed-publication.model';
import { Store } from '@ngrx/store';
import { RootStoreState, ReportStoreActions } from 'src/app/root-store';
import { ReportModel } from '../../models/report/report.model';
import { reportData } from '../../data/report-data';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProfileModel } from '../../models/baseUser/profile.model';
import { CommentFeedPublication } from '../../models/comment/comment-publication.model';
import { TubeModel } from '../../models/tube/tube.model';

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss']
})

export class ReportModalComponent {

  // default
  categorieSelected: number = 1
  page: number = 1

  // list of categorie
  categorieData = reportData

  // optional comment
  comment: string

  constructor(
    private store$: Store<RootStoreState.State>,
    private dialogRef: MatDialogRef<ReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportData
  ) { }
  

  changeCategorie(number: number): void {
    // to change the categorie
    this.categorieSelected = number
  }

  sendReport(): void {

    // send the report for each type
    switch (this.data.type) {
      case 'profile-report': {
        const report = new ReportModel(this.data.profile._id, 'profile', this.comment, this.categorieSelected)
        this.store$.dispatch(new ReportStoreActions.Report(report))
        this.page = 3
        break
      }
      case 'feed-publication-report': {
        const report = new ReportModel(this.data.publication._id, 'feed-publication', this.comment, this.categorieSelected)
        this.store$.dispatch(new ReportStoreActions.Report(report))
        this.page = 3
        break
      }
      case 'comment-feed-publication-report': {
        const report = new ReportModel(this.data.comment._id, 'comment-feed-publication', this.comment, this.categorieSelected)
        this.store$.dispatch(new ReportStoreActions.Report(report))
        this.page = 3
        break 
      }
      case 'tube-report': { 
        const report = new ReportModel(this.data.tube._id, 'tube', this.comment, this.categorieSelected)
        this.store$.dispatch(new ReportStoreActions.Report(report))
        this.page = 3
        break 
      }
      case 'comment-playlist-music-report': {
        const report = new ReportModel(this.data.comment._id, 'comment-playlist-music', this.comment, this.categorieSelected)
        this.store$.dispatch(new ReportStoreActions.Report(report))
        this.page = 3
        break 
      }
      case 'group-report': return null
      case 'page-report': return null
      case 'music-report': return null
      case 'musicProject-report': return null



      case 'comment-tube-report': return null // is coming
      default: break
    }

  }

  changePage(page: number): void{
    this.page = page
  }


  closeModal():void {
    this.dialogRef.close()
  }

}

interface ReportData {
  profile: ProfileModel
  publication: PicturePublication | PostPublication | VideoPublication | any
  comment: CommentFeedPublication
  tube: TubeModel
  type: string
}
