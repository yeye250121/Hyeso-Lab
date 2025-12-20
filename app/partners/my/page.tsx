'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/partners/store'
import api from '@/lib/partners/api'
import PartnerLayout from '@/components/partners/PartnerLayout'
import { Copy, Check, ChevronRight, ChevronDown, X, Loader2, FileText, User, Key, LogOut, Building2, Phone, CreditCard, Globe, ExternalLink } from 'lucide-react'

export default function MyPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, setAuth } = useAuthStore()

  const [copied, setCopied] = useState(false)

  // 닉네임 변경 모달
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [isNicknameLoading, setIsNicknameLoading] = useState(false)

  // 비밀번호 변경 모달
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // 사업자 정보 아코디언
  const [isBusinessInfoOpen, setIsBusinessInfoOpen] = useState(false)

  // 전화번호 변경 모달
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [isPhoneLoading, setIsPhoneLoading] = useState(false)

  // 계좌정보 변경 모달
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [isBankLoading, setIsBankLoading] = useState(false)

  // 내 랜딩페이지 목록
  const [landingPages, setLandingPages] = useState<any[]>([])
  const [isLandingPagesLoading, setIsLandingPagesLoading] = useState(true)
  const [isLandingPagesOpen, setIsLandingPagesOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/partners/login')
    }
  }, [])

  // 랜딩페이지 목록 로드
  useEffect(() => {
    const fetchLandingPages = async () => {
      try {
        const response = await api.get('/partners/landing-pages')
        setLandingPages(response.data.landingPages || [])
      } catch (error) {
        console.error('Failed to fetch landing pages:', error)
      } finally {
        setIsLandingPagesLoading(false)
      }
    }

    if (isAuthenticated()) {
      fetchLandingPages()
    }
  }, [])

  const handleCopyCode = async () => {
    if (!user) return
    await navigator.clipboard.writeText(user.uniqueCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = () => {
    logout()
    router.push('/partners/login')
  }

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) return

    setIsNicknameLoading(true)
    try {
      const response = await api.patch('/partners/profile', {
        nickname: newNickname.trim(),
      })

      // 스토어 업데이트
      if (user) {
        setAuth(useAuthStore.getState().token!, {
          ...user,
          nickname: newNickname.trim(),
        })
      }

      setIsNicknameModalOpen(false)
      setNewNickname('')
    } catch (error: any) {
      alert(error.response?.data?.error || '닉네임 변경에 실패했습니다')
    } finally {
      setIsNicknameLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다')
      return
    }

    setIsPasswordLoading(true)
    try {
      await api.patch('/partners/password', {
        currentPassword,
        newPassword,
      })

      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      alert('비밀번호가 변경되었습니다')
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || '비밀번호 변경에 실패했습니다')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handlePhoneChange = async () => {
    setIsPhoneLoading(true)
    try {
      const response = await api.patch('/partners/profile', {
        phone: newPhone.trim() || null,
      })

      if (user) {
        setAuth(useAuthStore.getState().token!, {
          ...user,
          phone: newPhone.trim() || null,
        })
      }

      setIsPhoneModalOpen(false)
      setNewPhone('')
      alert('전화번호가 변경되었습니다')
    } catch (error: any) {
      alert(error.response?.data?.error || '전화번호 변경에 실패했습니다')
    } finally {
      setIsPhoneLoading(false)
    }
  }

  const handleBankChange = async () => {
    setIsBankLoading(true)
    try {
      const response = await api.patch('/partners/profile', {
        bankName: bankName.trim() || null,
        accountNumber: accountNumber.trim() || null,
        accountHolder: accountHolder.trim() || null,
      })

      if (user) {
        setAuth(useAuthStore.getState().token!, {
          ...user,
          bankName: bankName.trim() || null,
          accountNumber: accountNumber.trim() || null,
          accountHolder: accountHolder.trim() || null,
        })
      }

      setIsBankModalOpen(false)
      alert('계좌정보가 변경되었습니다')
    } catch (error: any) {
      alert(error.response?.data?.error || '계좌정보 변경에 실패했습니다')
    } finally {
      setIsBankLoading(false)
    }
  }

  return (
    <PartnerLayout title="마이페이지">
      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:block">
        <div className="max-w-3xl">
          {/* 프로필 카드 */}
          <div className="bg-bg-card rounded-card p-8 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1">
                  {user?.nickname || '파트너'}
                </h1>
                <p className="text-body text-text-secondary">{user?.uniqueCode}</p>
              </div>
              <div className="w-16 h-16 bg-action-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-action-primary" />
              </div>
            </div>

            <div className="mt-6 p-4 bg-bg-primary rounded-button flex items-center justify-between">
              <div>
                <p className="text-caption text-text-tertiary mb-1">내 파트너 코드</p>
                <p className="text-body text-text-primary font-medium">{user?.uniqueCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-button text-body font-medium transition-colors flex items-center gap-2 ${
                  copied
                    ? 'bg-status-done/10 text-status-done'
                    : 'bg-action-primary/10 text-action-primary hover:bg-action-primary/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 내 랜딩페이지 */}
          <div className="bg-bg-card rounded-card overflow-hidden mb-6">
            <button
              onClick={() => setIsLandingPagesOpen(!isLandingPagesOpen)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-action-primary/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-action-primary" />
                </div>
                <div className="text-left">
                  <p className="text-body text-text-primary font-medium">내 랜딩페이지</p>
                  <p className="text-caption text-text-tertiary">사용 가능한 랜딩페이지 {landingPages.length}개</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${isLandingPagesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLandingPagesOpen && (
              <div className="px-6 pb-5 border-t border-border">
                {isLandingPagesLoading ? (
                  <div className="py-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-text-tertiary" />
                  </div>
                ) : landingPages.length === 0 ? (
                  <div className="py-4 text-center text-text-tertiary text-body">
                    사용 가능한 랜딩페이지가 없습니다
                  </div>
                ) : (
                  <div className="space-y-3 pt-4">
                    {landingPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-4 bg-bg-primary rounded-button"
                      >
                        <div>
                          <p className="text-body text-text-primary font-medium">{page.name}</p>
                          {page.description && (
                            <p className="text-caption text-text-tertiary mt-1">{page.description}</p>
                          )}
                          <p className="text-caption text-action-primary mt-1">piooom.kr{page.url}</p>
                        </div>
                        <a
                          href={`https://piooom.kr${page.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-action-primary/10 text-action-primary rounded-button text-body font-medium hover:bg-action-primary/20 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          보기
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 메뉴 카드 */}
          <div className="bg-bg-card rounded-card overflow-hidden mb-6">
            <button
              onClick={() => router.push('/partners/settlements')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-action-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-action-primary" />
                </div>
                <div className="text-left">
                  <p className="text-body text-text-primary font-medium">내 정산서 확인하기</p>
                  <p className="text-caption text-text-tertiary">정산 내역을 확인하세요</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>
          </div>

          {/* 설정 카드 */}
          <div className="bg-bg-card rounded-card overflow-hidden mb-6">
            <button
              onClick={() => {
                setNewNickname(user?.nickname || '')
                setIsNicknameModalOpen(true)
              }}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-body text-text-primary">닉네임 변경</span>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>

            <div className="h-px bg-border mx-6" />

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-primary rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-body text-text-primary">비밀번호 변경</span>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>

            <div className="h-px bg-border mx-6" />

            <button
              onClick={() => {
                setNewPhone(user?.phone || '')
                setIsPhoneModalOpen(true)
              }}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-primary rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <span className="text-body text-text-primary">전화번호</span>
                  {user?.phone && (
                    <p className="text-caption text-text-tertiary">{user.phone}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>

            <div className="h-px bg-border mx-6" />

            <button
              onClick={() => {
                setBankName(user?.bankName || '')
                setAccountNumber(user?.accountNumber || '')
                setAccountHolder(user?.accountHolder || '')
                setIsBankModalOpen(true)
              }}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-primary rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <span className="text-body text-text-primary">정산 계좌</span>
                  {user?.bankName && user?.accountNumber && (
                    <p className="text-caption text-text-tertiary">{user.bankName} {user.accountNumber}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>
          </div>

          {/* 로그아웃 */}
          <div className="bg-bg-card rounded-card overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full px-6 py-5 flex items-center gap-4 hover:bg-bg-primary transition-colors"
            >
              <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-error" />
              </div>
              <span className="text-body text-error">로그아웃</span>
            </button>
          </div>

          {/* 사업자 정보 */}
          <div className="bg-bg-card rounded-card overflow-hidden mt-6">
            <button
              onClick={() => setIsBusinessInfoOpen(!isBusinessInfoOpen)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-primary rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-body text-text-primary">사업자 정보</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${isBusinessInfoOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBusinessInfoOpen && (
              <div className="px-6 pb-5 pt-2 border-t border-border">
                <div className="space-y-3 text-body text-text-secondary">
                  <div>
                    <p className="text-caption text-text-tertiary mb-1">상호명</p>
                    <p>케어온</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-tertiary mb-1">사업자등록번호</p>
                    <p>609-41-95762</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-tertiary mb-1">주소</p>
                    <p>경상남도 창원시 진해구 여명로25번나길 27, 1동 301호</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-tertiary mb-1">고객센터</p>
                    <p>010-7469-4385</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 버전 정보 */}
          <div className="mt-8 text-center">
            <p className="text-small text-text-tertiary">버전 1.0.0</p>
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden">
        {/* 프로필 섹션 */}
        <div className="bg-bg-card px-6 py-8">
          <h1 className="text-heading text-text-primary">
            {user?.nickname || '파트너'}
          </h1>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-caption text-text-tertiary">파트너 코드</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-body text-action-primary font-medium"
            >
              <span>{user?.uniqueCode}</span>
              {copied ? (
                <Check className="w-4 h-4 text-status-done" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 내 랜딩페이지 */}
        <div className="mt-3 bg-bg-card">
          <button
            onClick={() => setIsLandingPagesOpen(!isLandingPagesOpen)}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-action-primary" />
              <div>
                <span className="text-body text-text-primary">내 랜딩페이지</span>
                <p className="text-caption text-text-tertiary">{landingPages.length}개 사용 가능</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${isLandingPagesOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLandingPagesOpen && (
            <div className="px-6 pb-4 border-t border-bg-primary">
              {isLandingPagesLoading ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-text-tertiary" />
                </div>
              ) : landingPages.length === 0 ? (
                <div className="py-4 text-center text-text-tertiary text-body">
                  사용 가능한 랜딩페이지가 없습니다
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  {landingPages.map((page) => (
                    <div
                      key={page.id}
                      className="p-4 bg-bg-primary rounded-button"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-body text-text-primary font-medium">{page.name}</p>
                        <a
                          href={`https://piooom.kr${page.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-action-primary/10 text-action-primary rounded-button text-caption font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          보기
                        </a>
                      </div>
                      {page.description && (
                        <p className="text-caption text-text-tertiary">{page.description}</p>
                      )}
                      <p className="text-caption text-action-primary mt-1">piooom.kr{page.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 정산서 메뉴 */}
        <div className="mt-3 bg-bg-card">
          <button
            onClick={() => router.push('/partners/settlements')}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-action-primary" />
              <span className="text-body text-text-primary">내 정산서 확인하기</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* 설정 메뉴 */}
        <div className="mt-3 bg-bg-card">
          <button
            onClick={() => {
              setNewNickname(user?.nickname || '')
              setIsNicknameModalOpen(true)
            }}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <span className="text-body text-text-primary">닉네임 변경</span>
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>

          <div className="h-px bg-bg-primary mx-6" />

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <span className="text-body text-text-primary">비밀번호 변경</span>
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>

          <div className="h-px bg-bg-primary mx-6" />

          <button
            onClick={() => {
              setNewPhone(user?.phone || '')
              setIsPhoneModalOpen(true)
            }}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div>
              <span className="text-body text-text-primary">전화번호</span>
              {user?.phone && (
                <p className="text-caption text-text-tertiary">{user.phone}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>

          <div className="h-px bg-bg-primary mx-6" />

          <button
            onClick={() => {
              setBankName(user?.bankName || '')
              setAccountNumber(user?.accountNumber || '')
              setAccountHolder(user?.accountHolder || '')
              setIsBankModalOpen(true)
            }}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div>
              <span className="text-body text-text-primary">정산 계좌</span>
              {user?.bankName && user?.accountNumber && (
                <p className="text-caption text-text-tertiary">{user.bankName} {user.accountNumber}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* 로그아웃 */}
        <div className="mt-3 bg-bg-card">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left"
          >
            <span className="text-body text-error">로그아웃</span>
          </button>
        </div>

        {/* 사업자 정보 */}
        <div className="mt-3 bg-bg-card">
          <button
            onClick={() => setIsBusinessInfoOpen(!isBusinessInfoOpen)}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-text-secondary" />
              <span className="text-body text-text-primary">사업자 정보</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${isBusinessInfoOpen ? 'rotate-180' : ''}`} />
          </button>

          {isBusinessInfoOpen && (
            <div className="px-6 pb-4 pt-2 border-t border-bg-primary">
              <div className="space-y-3 text-body text-text-secondary">
                <div>
                  <p className="text-caption text-text-tertiary mb-1">상호명</p>
                  <p>케어온</p>
                </div>
                <div>
                  <p className="text-caption text-text-tertiary mb-1">사업자등록번호</p>
                  <p>609-41-95762</p>
                </div>
                <div>
                  <p className="text-caption text-text-tertiary mb-1">주소</p>
                  <p>경상남도 창원시 진해구 여명로25번나길 27, 1동 301호</p>
                </div>
                <div>
                  <p className="text-caption text-text-tertiary mb-1">고객센터</p>
                  <p>010-7469-4385</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버전 정보 */}
        <div className="mt-8 text-center">
          <p className="text-small text-text-tertiary">버전 1.0.0</p>
        </div>
      </div>

      {/* 닉네임 변경 모달 - 데스크탑/모바일 공통 */}
      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:items-center">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsNicknameModalOpen(false)}
          />
          {/* 데스크탑: 가운데 모달 / 모바일: 바텀시트 */}
          <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-bg-card rounded-t-[20px] lg:rounded-card p-6 lg:w-[400px] animate-slide-up lg:animate-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-text-primary">닉네임 변경</h2>
              <button onClick={() => setIsNicknameModalOpen(false)}>
                <X className="w-6 h-6 text-text-secondary" />
              </button>
            </div>

            <input
              type="text"
              placeholder="새 닉네임 입력"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary mb-4"
            />

            <button
              onClick={handleNicknameChange}
              disabled={isNicknameLoading || !newNickname.trim()}
              className="w-full py-4 bg-action-primary hover:bg-action-primary-hover disabled:bg-text-tertiary text-white rounded-button text-body font-semibold flex items-center justify-center gap-2"
            >
              {isNicknameLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 - 데스크탑/모바일 공통 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:items-center">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          {/* 데스크탑: 가운데 모달 / 모바일: 바텀시트 */}
          <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-bg-card rounded-t-[20px] lg:rounded-card p-6 lg:w-[400px] animate-slide-up lg:animate-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-text-primary">비밀번호 변경</h2>
              <button onClick={() => setIsPasswordModalOpen(false)}>
                <X className="w-6 h-6 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <input
                type="password"
                placeholder="현재 비밀번호"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
              />
              <input
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
              />
            </div>

            {passwordError && (
              <p className="text-error text-caption mb-4">{passwordError}</p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={isPasswordLoading}
              className="w-full py-4 bg-action-primary hover:bg-action-primary-hover disabled:bg-text-tertiary text-white rounded-button text-body font-semibold flex items-center justify-center gap-2"
            >
              {isPasswordLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '변경'
              )}
            </button>
          </div>
        </div>
      )}

      {/* 전화번호 변경 모달 */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:items-center">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsPhoneModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-bg-card rounded-t-[20px] lg:rounded-card p-6 lg:w-[400px] animate-slide-up lg:animate-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-text-primary">전화번호 변경</h2>
              <button onClick={() => setIsPhoneModalOpen(false)}>
                <X className="w-6 h-6 text-text-secondary" />
              </button>
            </div>

            <input
              type="tel"
              placeholder="전화번호 입력 (예: 010-1234-5678)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary mb-4"
            />

            <button
              onClick={handlePhoneChange}
              disabled={isPhoneLoading}
              className="w-full py-4 bg-action-primary hover:bg-action-primary-hover disabled:bg-text-tertiary text-white rounded-button text-body font-semibold flex items-center justify-center gap-2"
            >
              {isPhoneLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      )}

      {/* 계좌정보 변경 모달 */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:items-center">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsBankModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-bg-card rounded-t-[20px] lg:rounded-card p-6 lg:w-[400px] animate-slide-up lg:animate-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-text-primary">정산 계좌 설정</h2>
              <button onClick={() => setIsBankModalOpen(false)}>
                <X className="w-6 h-6 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-caption text-text-secondary mb-2">은행명</label>
                <input
                  type="text"
                  placeholder="예: 국민은행"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="block text-caption text-text-secondary mb-2">계좌번호</label>
                <input
                  type="text"
                  placeholder="- 없이 입력"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="block text-caption text-text-secondary mb-2">예금주</label>
                <input
                  type="text"
                  placeholder="예금주명"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>

            <button
              onClick={handleBankChange}
              disabled={isBankLoading}
              className="w-full py-4 bg-action-primary hover:bg-action-primary-hover disabled:bg-text-tertiary text-white rounded-button text-body font-semibold flex items-center justify-center gap-2"
            >
              {isBankLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      )}
    </PartnerLayout>
  )
}
