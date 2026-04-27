interface ReelsYouTubeProps {
  videos: string[]
}

export function ReelsYouTube({ videos }: ReelsYouTubeProps) {
  if (!videos || videos.length === 0) return null

  return (
    <section className="py-12 px-4 bg-muted/30" aria-label="Videos de YouTube">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold mb-8 text-center">Nuestros Videos</h2>
        <div className="flex flex-col items-center gap-6">
          {videos.map((videoUrl, index) => (
              <iframe
                key={index}
                src={videoUrl}
                title={`Video ${index + 1}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full max-w-sm aspect-[9/16] rounded-lg"
              />
          ))}
        </div>
      </div>
    </section>
  )
}