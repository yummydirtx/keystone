import type React from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

interface ImageViewerProps {
  visible: boolean
  imageUrl: string
  onClose: () => void
}

export function ImageViewer({ visible, imageUrl, onClose }: ImageViewerProps) {
  if (!visible) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `receipt-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Lightbox
        open={visible}
        close={onClose}
        slides={[
          {
            src: imageUrl,
            alt: 'Receipt',
          },
        ]}
        plugins={[Zoom]}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.5,
          scrollToZoom: true,
        }}
        carousel={{
          finite: true,
          preload: 0,
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '80px',
            zIndex: 2000,
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              color: 'white',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            Download
          </button>
        </div>
      )}
    </>
  )
}
