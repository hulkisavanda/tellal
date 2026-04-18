declare module 'iyzipay' {
  /** iyzipay SDK yanıtları modül içinde tiplenmediği için result any bırakıldı */
  type IyzipayCallback = (err: unknown, result: any) => void

  interface IyzipayConfig {
    apiKey: string
    secretKey: string
    uri: string
  }

  interface CheckoutFormInitializeCreateRequest {
    locale: string
    conversationId: string
    price: string
    paidPrice: string
    currency: string
    basketId: string
    paymentGroup: string
    callbackUrl: string
    enabledInstallments: number[]
    buyer: Record<string, string>
    shippingAddress: Record<string, string>
    billingAddress: Record<string, string>
    basketItems: Array<Record<string, string>>
  }

  interface CheckoutFormRetrieveRequest {
    locale: string
    conversationId: string
    token: string
  }

  export default class Iyzipay {
    constructor(config: IyzipayConfig)
    checkoutFormInitialize: {
      create: (request: CheckoutFormInitializeCreateRequest, cb: IyzipayCallback) => void
    }
    checkoutForm: {
      retrieve: (request: CheckoutFormRetrieveRequest, cb: IyzipayCallback) => void
    }
  }
}
