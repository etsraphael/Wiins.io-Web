import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { RootStoreState, PlayerMusicStoreSelectors, PlayerMusicStoreActions, MyMusicLikedStoreActions } from '../../root-store';
import { skipWhile, filter, distinctUntilChanged } from 'rxjs/operators';
import { Music } from '../../core/models/publication/music/music.model';
import { ControlMusicService } from 'src/app/core/services/control-music/control-music.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mini-player-music',
  templateUrl: './mini-player-music.component.html',
  styleUrls: ['./mini-player-music.component.scss']
})

export class MiniPlayerMusicComponent implements OnInit, OnDestroy {

  // controls
  musicPlaying$: Observable<Boolean>
  musicList$: Observable<Music[]>
  audio$: Observable<Music>
  command$: Observable<string>
  SubMusicPlaying: Subscription

  // progress bar
  progress: number = 0
  timerStart: string = '00:00'
  timerEnd: string = '00:00'

  @ViewChild('currentMusic', { static: false }) audioRef: ElementRef;

  constructor(
    private store$: Store<RootStoreState.State>,
    public controlMusicService: ControlMusicService,
    private translate: TranslateService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {

    // to add action during the music is playing
    this.listenerControlMusic()

    // to select if the music was choosen
    this.musicPlaying$ = this.store$.pipe(
      select(PlayerMusicStoreSelectors.selectIfPlaying),
      skipWhile(val => val === null),
      filter(value => value !== undefined),
    )

    // to select all the music in the list
    this.musicList$ = this.store$.pipe(
      select(PlayerMusicStoreSelectors.selectMusicList),
      skipWhile(val => val === null),
      filter(value => value !== undefined),
    )

    // to know if a music is playing
    this.audio$ = this.store$.pipe(
      select(PlayerMusicStoreSelectors.selectMusicIsPlaying),
      distinctUntilChanged(),
      skipWhile(val => val === null),
      filter(value => value !== undefined),
    )

    // to controls the music
    this.command$ = this.store$.pipe(
      select(PlayerMusicStoreSelectors.selectCommand),
      filter(value => (value !== undefined) && (value !== null)),
    )

    // to do somes actions for each command
    this.SubMusicPlaying = this.command$.subscribe(action => {
      switch (action) {
        case 'continue':
          this.audioRef.nativeElement.play()
          this.store$.dispatch(new PlayerMusicStoreActions.Continue)
          break;
        case 'pause':
          this.audioRef.nativeElement.pause()
          this.store$.dispatch(new PlayerMusicStoreActions.Pause)
          break;
        default: break;
      }
      // reset the command
      this.store$.dispatch(new PlayerMusicStoreActions.Command(null))
    })

  }

  listenerControlMusic(): void {
    // set the progress bar
    setTimeout(() => { this.listenerTime() }, 1000);
  }

  listenerTime() {
    // get the current time for the progress bar
    return this.audioRef.nativeElement.addEventListener('timeupdate', (data: any) => {
      this.progress = Math.round((data.target.currentTime / data.target.duration) * 100)
      this.getTimerEndAndStart(data.target.currentTime, data.target.duration)
    })
  }


  getTimerEndAndStart(position: number, duration: number){
    if (position <= 0) return null
    const minutes = Math.floor(position / 60)
    let seconds = Math.round(position - minutes * 60)
    this.timerStart = (minutes + ':' + seconds)
    this.timerEnd = String( (-1 * (minutes - Math.floor(duration / 60)) + ':' + -(seconds - 60)))
  }

  supportMessage() {
    const errorModal = this._snackBar.open(
      this.translate.instant('DONATION.Function-unavailable-at-the-moment-join-our-discord-to-help-with-creation'),
      this.translate.instant('CORE.Join'), {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 8000
    })

    errorModal.onAction().subscribe(() => window.open('https://discord.gg/jMyc443', '_blank'))
  }

  like(music: Music) {

    // save the music
    if (music.isLiked == false) {
      this.store$.dispatch(new MyMusicLikedStoreActions.LikeMusic(music))
      this.store$.dispatch(new PlayerMusicStoreActions.UpdateMusicLike(music._id))
    } 
    // delete the music
    else {
      this.store$.dispatch(new MyMusicLikedStoreActions.DisLikeMusic(music))
      this.store$.dispatch(new PlayerMusicStoreActions.UpdateMusicDisLike(music._id))
    }

  }

  ngOnDestroy(): void {
    // unsubscribe all var
    if(this.SubMusicPlaying) this.SubMusicPlaying.unsubscribe()
  }

}
