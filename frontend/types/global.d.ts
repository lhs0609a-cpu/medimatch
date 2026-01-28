// 전역 타입 선언

interface TossPaymentsInstance {
  requestPayment: (method: string, options: any) => Promise<any>
}

interface TossPaymentsConstructor {
  new (clientKey: string): TossPaymentsInstance
  (clientKey: string): TossPaymentsInstance
}

declare global {
  interface Window {
    TossPayments: TossPaymentsConstructor
  }
}

export {}
