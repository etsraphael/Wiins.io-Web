import { TestBed } from '@angular/core/testing';

import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
