import { Component, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { PaymentService, CoinBaseResponse } from 'src/app/core/services/payment/payment.service';
import { ActivatedRoute } from '@angular/router';
import { CardPayment } from 'src/app/core/models/payment/cardPayment.model';
import { UserModel } from 'src/app/core/models/baseUser/user.model';
import { RootStoreState, MyUserStoreSelectors } from 'src/app/root-store';
import { Store, select } from '@ngrx/store';
import { skipWhile, filter } from 'rxjs/operators';

@Component({
  selector: 'app-premium-setting',
  templateUrl: './premium-setting.component.html',
  styleUrls: ['./premium-setting.component.scss']
})

export class PremiumSettingComponent implements OnInit {

  // visual
  chargedBtnCliked = false
  showMessagePayment = false

  // info
  price: string

  // payment
  paymentSub: Subscription

  // my user
  user$: Observable<UserModel>

  constructor(
    private translate: TranslateService,
    private _snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private activatedRoute: ActivatedRoute,
    private store$: Store<RootStoreState.State>,
  ) { }


  ngOnInit(): void {

    // to select my user
    this.user$ = this.store$.pipe(
      select(MyUserStoreSelectors.select),
      skipWhile(val => val == null),
      filter(val => !!val)
    )

  }

  showChargeInput(): void {
    this.chargedBtnCliked = true
  }

  generatePayment(): void | MatSnackBarRef<SimpleSnackBar> {

    // check a valid price 
    if (!this.price) {
      return this._snackBar.open(
        this.translate.instant('ERROR-MESSAGE.els-ar-missing'),
        this.translate.instant('CORE.close'),
        { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 5000 }
      )
    }

    // create the card
    const cardPayment = new CardPayment(
      'title',
      this.translate.instant('WARNING.BC-make-sure-you-have-the-correct-address'),
      'fixed_price',
      { amount: this.price, currency: 'USD' },
      {
        userID: this.activatedRoute.parent.snapshot.data['loadedUser']._id,
        price: Number(this.price)
      }
    )

    // send the request to coinbase commerce
    this.paymentSub = this.paymentService.getCardPayment(cardPayment).subscribe(
      (action: CoinBaseResponse) => {
        // redirection
        window.open(action.data.hosted_url, '_blank')
        this.chargedBtnCliked = false
        this.showMessagePayment = true
      },
      () => {
        // error message
        this._snackBar.open(
          this.translate.instant('ERROR-MESSAGE.A-err-has-occurred'),
          this.translate.instant('CORE.close'),
          { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 5000 }
        )
      }
    )


  }

}