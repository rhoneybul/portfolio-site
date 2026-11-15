import Image from 'next/image'
import {urlFor} from '@/sanity/image'

type LogoImage = Parameters<typeof urlFor>[0] & {asset?: unknown}

// A company's or product's logo, cropped to a rounded square so app icons, favicons and brand
// marks sit together. Sized by its CSS class; `pixels` is the largest it is drawn, for a sharp
// image on a retina screen.
export function Logo({image, className, pixels}: {image: LogoImage | null; className: string; pixels: number}) {
  if (!image?.asset) return null
  return (
    <Image
      src={urlFor(image).width(pixels * 2).height(pixels * 2).fit('crop').url()}
      alt=""
      width={pixels}
      height={pixels}
      className={`logo ${className}`}
    />
  )
}
