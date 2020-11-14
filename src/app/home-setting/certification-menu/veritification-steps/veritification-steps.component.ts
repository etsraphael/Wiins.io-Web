import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange, MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CertificationService } from 'src/app/core/services/certification/certification.service';
import { UploadWithoutInjectorService } from 'src/app/core/services/upload/upload-without-injector.service';
import { RespondGetUploadUrl, UploadService, UrlSigned } from 'src/app/core/services/upload/upload.service';
import { environment } from 'src/environments/environment'
import * as uuid from 'uuid'

@Component({
  selector: 'app-veritification-steps',
  templateUrl: './veritification-steps.component.html',
  styleUrls: ['./veritification-steps.component.scss']
})

export class VeritificationStepsComponent implements OnInit, OnDestroy {

  // file
  fileIdname: string
  pictureTakeName: string
  fileIdLink: string
  fileId: File
  pictureTake: File
  pictureTakeLink: string

  // sub
  uploadSubFileId: Subscription

  // form
  checkedCond = false

  // service 
  requestPending: boolean = false
  loading: boolean = false

  constructor(
    private translate: TranslateService,
    private _snackBar: MatSnackBar,
    private certificationService: CertificationService,
    private uploadService: UploadService,
    private uploadService2: UploadWithoutInjectorService
  ) { }

  ngOnInit() {

    // to know if the request is already sent
    this.certificationService.getVerificationProfile().pipe(take(1)).subscribe(
      () => { this.requestPending = true },
      () => { this.requestPending = false }
    )

  }

  saveIdFile(files: any) {
    if (files.length === 0) return null
    this.fileIdname = files[0].name
    this.fileId = files[0]
  }

  savepictureTakeFile(files: any) {
    if (files.length == 0) return null
    this.pictureTakeName = files[0].name
    this.pictureTake = files[0]
  }

  changeCheckBtn(event: MatCheckboxChange) {
    this.checkedCond = event.checked
  }

  confirm(): void | MatSnackBarRef<SimpleSnackBar> {

    if (!this.fileIdname || !this.pictureTakeName) {
      return this._snackBar.open(
        this.translate.instant('ERROR-MESSAGE.Els-are-incorrects'), null,
        { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 5000 }
      )
    }

    this.loading = true

    // send the fileId
    const reader = new FileReader()
    reader.onloadend = _event => { this.uploadFile(this.fileId, 'fileId') }
    reader.readAsDataURL(this.fileId)

    // send the pictureTake and send the verification
    const reader2 = new FileReader()
    reader2.onloadend = _event => { this.uploadFile(this.pictureTake, 'pictureTake') }
    reader2.readAsDataURL(this.pictureTake)
    
  }

  // to upload a file
  uploadFile(file: File, type: string) {

    // create the object to get the signed url from the backend
    const urlSigned: UrlSigned = {
      Bucket: environment.link_verification,
      Key: uuid.v4(),
      ContentType: file.type
    }

    // to get the s3 signed url
    this.uploadSubFileId = this.uploadService2.getSignedUrl(urlSigned).subscribe(
      (response: RespondGetUploadUrl) => {
        // upload to s3
        return this.uploadService.uploadfileAWSS3(response.url, file).subscribe(
          (response: HttpEvent<{}>) => this.updateProgress(response, urlSigned, type),
          (error: any) => console.log(error))
      },
      (error: RespondGetUploadUrl) => console.log(error)

    )

  }

  // to update the loading bar
  updateProgress(event: HttpEvent<{}>, urlSigned: UrlSigned, type: string): void {
    switch (event.type) {
      case HttpEventType.Response: { this.sendTheConfirmation(urlSigned.Bucket, urlSigned.Key, type); break; }
      default: break
    }
  }

  // update the url
  sendTheConfirmation(bucketName: string, key: string, type: string): void {

    switch (type) {
      case 'fileId':
        this.fileIdLink = this.uploadService.getFileUrlAfterUpload(bucketName, key)
        break;
      case 'pictureTake':
        this.pictureTakeLink = this.uploadService.getFileUrlAfterUpload(bucketName, key)
        this.sendVerification()
        break;
    }
  }

  sendVerification(): void | MatSnackBarRef<SimpleSnackBar> {
    
      if (!this.pictureTakeLink || !this.fileIdLink) {
        return this._snackBar.open(
          this.translate.instant('ERROR-MESSAGE.A-err-has-occurred'), null,
          { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 5000 }
        )
      }
  
      this.loading = false
      this.requestPending = true
  }

  ngOnDestroy(): void {
    if(this.uploadSubFileId) this.uploadSubFileId.unsubscribe()
  }

}

export interface VerificationForm {
  identityFile: string
  pictureTakeFile: string
}