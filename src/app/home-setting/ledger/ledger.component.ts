import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { filter, skipWhile, take } from 'rxjs/operators';
import { PasswordValidationComponent } from 'src/app/core/modal/password-validation/password-validation.component';
import { TransfertCryptoModalComponent } from 'src/app/core/modal/transfert-crypto-modal/transfert-crypto-modal.component';
import { UserModel } from 'src/app/core/models/baseUser/user.model';
import { CardPayment } from 'src/app/core/models/payment/cardPayment.model';
import { TransfertRequest } from 'src/app/core/models/payment/TransfertRequest.model';
import { AssetCryptoResponse, CryptoServiceService } from 'src/app/core/services/crypto/crypto-service.service';
import { AccountBalanceResponse, CoinBaseResponse, PaymentService, TransfertRequestSingle } from 'src/app/core/services/payment/payment.service';
import { TranslationService } from 'src/app/core/services/translation/translation.service';
import { MyUserStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.scss']
})

export class LedgerComponent implements OnInit {

  // visual
  chargedBtnCliked = false
  showMessagePayment = false

  // info
  price: string
  dayLeftSentence: string

  // payment
  paymentSub: Subscription

  // my user
  user$: Observable<UserModel>
  currencyArray = []
  totalBalance = 0

  // pending request
  transfertsRequests: TransfertRequest[] = []

  constructor(
    private translate: TranslateService,
    private _snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private activatedRoute: ActivatedRoute,
    private store$: Store<RootStoreState.State>,
    private cryptoServiceService: CryptoServiceService,
    public dialog: MatDialog,
    private translationService: TranslationService
  ) { }

  ngOnInit(): void {

    // to select my user
    this.user$ = this.store$.pipe(
      select(MyUserStoreSelectors.select),
      skipWhile(val => val == null),
      filter(val => !!val)
    )

    // load pending transfert
    this.paymentService.getTransfertRequest().pipe(
      select((x: TransfertRequestSingle) => x.result)
    ).subscribe((data: TransfertRequest[]) => this.transfertsRequests = data)

    // get the crypto assets in real time
    this.cryptoServiceService.getCryptoAssetPrice().pipe(take(1)).subscribe((response: AssetCryptoResponse) => {

      this.paymentService.getAccountBalance().pipe(take(1)).subscribe((action: AccountBalanceResponse) => {
        this.currencyArray = [
          { code: 'BTC', currency: 'Bitcoin (BTC)', amount: action.result.btc },
          { code: 'ETH', currency: 'Ethereum (ETH)', amount: action.result.eth },
          { code: 'BCH', currency: 'Bitcoin Cash (BCH)', amount: action.result.bch },
          { code: 'LTC', currency: 'Litecoin (LTC)', amount: action.result.ltc }
        ]

        for (let item of this.currencyArray) {
          item.price_usd =
            (Number(response.data.filter(obj => obj.symbol == item.code).map(x => x.metrics.market_data.price_usd))
              * item.amount).toFixed(2)
          item.market_price_usd = (Number(response.data.filter(obj => obj.symbol == item.code).map(x => x.metrics.market_data.price_usd)))
          this.totalBalance += Number(item.price_usd)
        }
      })
    })

    // get number of days before the next charge
    this.user$.pipe(take(1)).subscribe((data: UserModel) =>
      this.dayLeftSentence = this.translationService.getNumberOfDayBeforeTheNextRecharge(data.chargedUntil)
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
      '',
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

  openTransfertModal(amount: number, currency: string, marketPriceUsd: number, balanceAccount: number) {

    // not enougt to transfert
    if (amount < 1) {
      return this._snackBar.open(
        this.translate.instant('ERROR-MESSAGE.T-min-is-1$'),
        '', {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 8000
      })
    }
    // open the modal to transfert
    else {

      const transfertAccount: TransfertAccount = {
        amount,
        marketPriceUsd,
        balanceAccount,
        currency: currency.toLowerCase(),
        currentTime: Date.now(),
      }

      return this.dialog.open(TransfertCryptoModalComponent, {
        disableClose: true,
        panelClass: ['col-md-8', 'col-xl-6'],
        data: { transfertAccount }
      })

    }

  }

  openValidationModal(id: string) {
    // to open the modal
    this.dialog.open(PasswordValidationComponent, {
      panelClass: ['col-md-4'],
      data: { type: 'cancelTransfertResquest', id }
    })
  }

}

export interface TransfertAccount {
  amount: number
  currency: string
  currentTime: number
  marketPriceUsd: number
  balanceAccount: number
}