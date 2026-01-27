import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    })
  }

  const error = (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    })
  }

  const warning = (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    })
  }

  const loading = (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration,
    })
  }

  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  }

  // 프로미스 기반 토스트
  const promise = <T,>(
    promiseOrFunc: Promise<T> | (() => Promise<T>),
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promiseOrFunc, options)
  }

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
  }
}

// 자주 사용되는 토스트 메시지 프리셋
export const toastMessages = {
  // 성공 메시지
  saved: '저장되었습니다',
  created: '생성되었습니다',
  updated: '업데이트되었습니다',
  deleted: '삭제되었습니다',
  copied: '복사되었습니다',
  sent: '전송되었습니다',
  submitted: '제출되었습니다',
  loggedIn: '로그인되었습니다',
  loggedOut: '로그아웃되었습니다',
  registered: '회원가입이 완료되었습니다',

  // 에러 메시지
  networkError: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  serverError: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  unauthorized: '로그인이 필요합니다.',
  forbidden: '접근 권한이 없습니다.',
  notFound: '요청한 리소스를 찾을 수 없습니다.',
  validationError: '입력 정보를 확인해주세요.',
  unknownError: '알 수 없는 오류가 발생했습니다.',

  // 경고 메시지
  unsavedChanges: '저장하지 않은 변경 사항이 있습니다.',
  sessionExpiring: '세션이 곧 만료됩니다.',

  // 정보 메시지
  processing: '처리 중입니다...',
  uploading: '업로드 중입니다...',
}

export default useToast
