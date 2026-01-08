'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Download, FileText, Share2, Printer,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'
import { simulationService, paymentService } from '@/lib/api/services'
import ReportPreview from '@/components/report/ReportPreview'
import { toast } from 'sonner'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const simulationId = params.id as string

  const [isPurchased, setIsPurchased] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)

  // Check for payment success from redirect
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success')
    if (paymentSuccess === 'true') {
      setIsPurchased(true)
      toast.success('결제가 완료되었습니다. 리포트를 확인하세요.')
      // Clean up URL
      router.replace(`/simulate/report/${simulationId}`)
    }
  }, [searchParams, simulationId, router])

  // Fetch simulation data
  const { data: simulation, isLoading, error } = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: () => simulationService.get(simulationId),
    enabled: !!simulationId,
  })

  // Check if report is already purchased
  const { data: reportStatus } = useQuery({
    queryKey: ['report-status', simulationId],
    queryFn: async () => {
      try {
        const response = await simulationService.downloadReport(simulationId)
        return { purchased: true, reportUrl: response.download_url }
      } catch {
        return { purchased: false, reportUrl: null }
      }
    },
    enabled: !!simulationId,
  })

  useEffect(() => {
    if (reportStatus?.purchased) {
      setIsPurchased(true)
    }
  }, [reportStatus])

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      // Prepare payment
      const prepareResponse = await paymentService.preparePayment({
        product_id: 'simulation_report',
        product_name: 'AI 상권분석 리포트',
        amount: 30000,
      })

      // Redirect to Toss Payments
      const { orderId } = prepareResponse

      // Store simulation ID for callback
      sessionStorage.setItem('pending_report_simulation_id', simulationId)

      // In real implementation, you would redirect to Toss Payments here
      // For now, we'll simulate a successful payment
      return prepareResponse
    },
    onSuccess: async (data) => {
      // In production, this would be handled by Toss Payments callback
      // For demo, we'll show a payment modal or redirect
      setIsPaymentProcessing(true)

      try {
        // Call backend to generate report after payment confirmation
        await simulationService.purchaseReport(simulationId)
        setIsPurchased(true)
        toast.success('결제가 완료되었습니다!')
      } catch (err) {
        toast.error('리포트 생성에 실패했습니다.')
      } finally {
        setIsPaymentProcessing(false)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '결제 준비에 실패했습니다.')
    },
  })

  // Download PDF mutation
  const downloadMutation = useMutation({
    mutationFn: () => simulationService.downloadReport(simulationId),
    onSuccess: (data) => {
      // Create download link
      if (data.download_url) {
        window.open(data.download_url, '_blank')
        toast.success('PDF 다운로드가 시작됩니다.')
      }
    },
    onError: (error: any) => {
      toast.error('다운로드에 실패했습니다.')
    },
  })

  const handlePurchase = () => {
    if (!simulation) return
    purchaseMutation.mutate()
  }

  const handleDownload = () => {
    if (!isPurchased) {
      toast.error('먼저 리포트를 구매해주세요.')
      return
    }
    downloadMutation.mutate()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI 상권분석 리포트',
          text: `${simulation?.address} ${simulation?.clinic_type} 개원 분석 리포트`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(window.location.href)
      toast.success('링크가 복사되었습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">리포트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">리포트를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">시뮬레이션 데이터가 존재하지 않거나 접근 권한이 없습니다.</p>
          <Link href="/simulate" className="btn-primary">
            새 시뮬레이션 시작
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/simulate" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">리포트</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPurchased && (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                    className="btn-secondary"
                    title="PDF 다운로드"
                  >
                    {downloadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button onClick={handlePrint} className="btn-ghost" title="인쇄">
                    <Printer className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={handleShare} className="btn-ghost" title="공유">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Payment Processing Overlay */}
      {isPaymentProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card p-8 text-center max-w-sm">
            <Loader2 className="w-12 h-12 animate-spin text-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">결제 처리 중...</h3>
            <p className="text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Purchase Success Banner */}
        {isPurchased && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 print:hidden">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <span className="font-medium text-green-800 dark:text-green-200">
                프리미엄 리포트 활성화됨
              </span>
              <span className="text-green-700 dark:text-green-300 ml-2">
                모든 분석 내용을 확인할 수 있습니다.
              </span>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="btn-primary bg-green-600 hover:bg-green-700"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF 다운로드
            </button>
          </div>
        )}

        {/* Report Preview */}
        <ReportPreview
          simulation={simulation}
          isPurchased={isPurchased}
          onPurchase={handlePurchase}
          isLoading={purchaseMutation.isPending || isPaymentProcessing}
        />

        {/* Bottom CTA for non-purchased */}
        {!isPurchased && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 print:hidden">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">AI 상권분석 리포트</h4>
                <p className="text-sm text-muted-foreground">
                  SWOT 분석, 리스크 요인, 맞춤 전략 포함
                </p>
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
                className="btn-primary text-lg px-8 py-3"
              >
                {purchaseMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    처리중...
                  </>
                ) : (
                  <>3만원 결제하기</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Spacer for fixed bottom bar */}
        {!isPurchased && <div className="h-24" />}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .glass {
            position: static !important;
            background: white !important;
          }
          .card {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  )
}
