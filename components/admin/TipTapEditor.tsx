'use client'

import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import { Node as TiptapNode, mergeAttributes } from '@tiptap/core'
import { useRef, useState, useCallback, useEffect, DragEvent } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Undo,
  Redo,
  Link as LinkIcon,
  Youtube as YoutubeIconLucide,
  Quote,
  Minus,
  Code,
  ExternalLink,
  Trash2,
  Upload,
  Presentation,
} from 'lucide-react'
import api from '@/lib/admin/api'

// Google Slides Embed Extension
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    googleSlides: {
      setGoogleSlides: (options: { src: string }) => ReturnType
    }
  }
}

const GoogleSlides = TiptapNode.create({
  name: 'googleSlides',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '500',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="docs.google.com/presentation"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'google-slides-wrapper', 'data-slides-src': HTMLAttributes.src },
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          frameborder: '0',
          allowfullscreen: 'true',
          mozallowfullscreen: 'true',
          webkitallowfullscreen: 'true',
        }),
      ],
      [
        'button',
        {
          class: 'slides-fullscreen-btn',
          type: 'button',
          title: '전체화면으로 보기',
        },
        '전체화면',
      ],
    ]
  },

  addCommands() {
    return {
      setGoogleSlides:
        (options: { src: string }) =>
        ({ commands }) => {
          // Convert pub URL to embed URL
          let embedUrl = options.src
          if (embedUrl.includes('/pub?')) {
            embedUrl = embedUrl.replace('/pub?', '/embed?')
          } else if (!embedUrl.includes('/embed')) {
            // If it's a regular view URL, convert to embed
            embedUrl = embedUrl.replace(/\/d\/e\/([^/]+).*/, '/d/e/$1/embed')
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
              width: '100%',
              height: '500',
            },
          })
        },
    }
  },
})

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
}

const MenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded transition-colors ${
      disabled
        ? 'text-text-tertiary cursor-not-allowed'
        : isActive
        ? 'bg-action-primary text-white'
        : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
    }`}
  >
    {children}
  </button>
)

const MenuBar = ({ editor, onImageUpload }: { editor: Editor | null; onImageUpload: () => void }) => {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showSlidesInput, setShowSlidesInput] = useState(false)
  const [slidesUrl, setSlidesUrl] = useState('')

  if (!editor) return null

  const handleSetLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run()
    setShowLinkInput(false)
  }

  const handleAddYoutube = () => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 360,
      })
    }
    setYoutubeUrl('')
    setShowYoutubeInput(false)
  }

  const handleAddSlides = () => {
    if (slidesUrl) {
      editor.commands.setGoogleSlides({ src: slidesUrl })
    }
    setSlidesUrl('')
    setShowSlidesInput(false)
  }

  return (
    <div className="p-2">
      <div className="flex flex-wrap gap-1">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="굵게"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="기울임"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="인라인 코드"
        >
          <Code className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="제목 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="제목 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="제목 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="글머리 기호 목록"
        >
          <List className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="번호 매기기 목록"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="인용구"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="구분선"
        >
          <Minus className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="왼쪽 정렬"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="가운데 정렬"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="오른쪽 정렬"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-border mx-1" />

        <MenuButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="링크"
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>

        <MenuButton onClick={onImageUpload} title="이미지 삽입">
          <ImageIcon className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          title="유튜브 삽입"
        >
          <YoutubeIconLucide className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => setShowSlidesInput(!showSlidesInput)}
          title="Google 슬라이드 삽입"
        >
          <Presentation className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="실행 취소"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="다시 실행"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-bg-primary rounded-lg mx-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-1.5 text-small bg-white border border-border rounded focus:ring-2 focus:ring-action-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="px-3 py-1.5 text-small bg-action-primary text-white rounded hover:bg-action-primary/90"
          >
            적용
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={handleRemoveLink}
              className="px-3 py-1.5 text-small bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              제거
            </button>
          )}
        </div>
      )}

      {/* Youtube Input */}
      {showYoutubeInput && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-bg-primary rounded-lg mx-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 py-1.5 text-small bg-white border border-border rounded focus:ring-2 focus:ring-action-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleAddYoutube()}
          />
          <button
            type="button"
            onClick={handleAddYoutube}
            className="px-3 py-1.5 text-small bg-action-primary text-white rounded hover:bg-action-primary/90"
          >
            삽입
          </button>
        </div>
      )}

      {/* Google Slides Input */}
      {showSlidesInput && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-bg-primary rounded-lg mx-2">
          <input
            type="url"
            value={slidesUrl}
            onChange={(e) => setSlidesUrl(e.target.value)}
            placeholder="https://docs.google.com/presentation/d/e/.../pub?..."
            className="flex-1 px-3 py-1.5 text-small bg-white border border-border rounded focus:ring-2 focus:ring-action-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSlides()}
          />
          <button
            type="button"
            onClick={handleAddSlides}
            className="px-3 py-1.5 text-small bg-action-primary text-white rounded hover:bg-action-primary/90"
          >
            삽입
          </button>
        </div>
      )}
    </div>
  )
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showImageLinkInput, setShowImageLinkInput] = useState(false)
  const [imageLinkUrl, setImageLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-action-primary',
        },
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-action-primary underline',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
      }),
      GoogleSlides,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor outline-none min-h-[400px] p-4 prose max-w-none',
      },
    },
  })

  // 이미지 파일 업로드 함수 (공통)
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/admin/guides/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      return response.data.url
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('이미지 업로드에 실패했습니다')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const url = await uploadImage(file)
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  // 드래그앤드롭 핸들러
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // 에디터 영역을 벗어났을 때만 드래그 상태 해제
    const relatedTarget = e.relatedTarget as Node | null
    if (!editorContainerRef.current?.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!editor) return

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    for (const file of imageFiles) {
      const url = await uploadImage(file)
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }, [editor, uploadImage])

  // 이미지 선택 감지 및 링크 추가
  const handleSetImageLink = useCallback(() => {
    if (!editor || !imageLinkUrl) return

    // 현재 선택된 노드가 이미지인지 확인
    const { state } = editor
    const { selection } = state
    const node = state.doc.nodeAt(selection.from)

    if (node?.type.name === 'image') {
      const src = node.attrs.src
      // 이미지를 링크로 감싸기
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: imageLinkUrl, target: '_blank' } }],
              text: ' ',
            },
          ],
        })
        .run()

      // 이미지 다시 삽입하면서 링크 적용
      const imgHtml = `<a href="${imageLinkUrl}" target="_blank"><img src="${src}" /></a>`
      editor.commands.insertContent(imgHtml)
    }

    setImageLinkUrl('')
    setShowImageLinkInput(false)
  }, [editor, imageLinkUrl])

  // 클립보드에서 이미지 붙여넣기 지원
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!editor) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const url = await uploadImage(file)
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [editor, uploadImage])

  return (
    <div
      ref={editorContainerRef}
      className="border border-border rounded-card overflow-hidden bg-white relative flex flex-col h-[600px]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 드래그앤드롭 오버레이 */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-action-primary/10 border-2 border-dashed border-action-primary flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-12 h-12 text-action-primary mx-auto mb-2" />
            <p className="text-lg font-medium text-action-primary">이미지를 여기에 놓으세요</p>
            <p className="text-sm text-text-secondary mt-1">이미지 파일을 드롭하면 자동으로 업로드됩니다</p>
          </div>
        </div>
      )}

      {/* 업로드 중 오버레이 */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-action-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-text-secondary">이미지 업로드 중...</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Sticky MenuBar */}
      <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <MenuBar editor={editor} onImageUpload={triggerImageUpload} />
      </div>

      {/* 이미지 버블 메뉴 - 이미지 클릭 시 나타남 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor, state }) => {
            // 현재 선택된 노드가 이미지인지 확인
            const { selection } = state
            const node = state.doc.nodeAt(selection.from)
            return node?.type.name === 'image'
          }}
        >
          <div className="flex items-center gap-1 bg-white shadow-lg border border-border rounded-lg p-1">
            {showImageLinkInput ? (
              <div className="flex items-center gap-1 px-2">
                <input
                  type="url"
                  value={imageLinkUrl}
                  onChange={(e) => setImageLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-48 px-2 py-1 text-sm border border-border rounded focus:ring-1 focus:ring-action-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleSetImageLink()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSetImageLink}
                  className="px-2 py-1 text-sm bg-action-primary text-white rounded hover:bg-action-primary/90"
                >
                  적용
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageLinkInput(false)
                    setImageLinkUrl('')
                  }}
                  className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowImageLinkInput(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-primary rounded transition-colors"
                  title="이미지에 링크 추가"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>링크 추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteSelection().run()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-status-error hover:bg-red-50 rounded transition-colors"
                  title="이미지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>삭제</span>
                </button>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* 에디터 하단 도움말 */}
      <div className="px-4 py-2 border-t border-border bg-bg-primary text-xs text-text-tertiary">
        <span className="mr-4">💡 이미지를 드래그해서 놓거나 클립보드에서 붙여넣기(Ctrl+V) 가능</span>
        <span>• 이미지 클릭 시 링크 추가 가능</span>
      </div>

      <style jsx global>{`
        .tiptap-editor p {
            min-height: 1.5em;
        }
      `}</style>
    </div>
  )
}