// https://reactbits.dev/backgrounds/light-rays
'use client'

import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { useEffect, useRef, useState } from 'react'

import { useIsDark } from '~/hooks/common/use-is-dark'
import { clsxm } from '~/lib/cn'

export type RaysOrigin =
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'right'
  | 'left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'

interface LightRaysProps {
  raysOrigin?: RaysOrigin
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  pulsating?: boolean
  fadeDistance?: number
  saturation?: number
  followMouse?: boolean
  mouseInfluence?: number
  noiseAmount?: number
  distortion?: number
  // Edge feather amounts in CSS pixels
  edgeFadeLeft?: number
  edgeFadeRight?: number
  edgeFadeTop?: number
  edgeFadeBottom?: number
  className?: string
}

const DEFAULT_COLOR = '#ffffff'

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? [
        Number.parseInt(m[1], 16) / 255,
        Number.parseInt(m[2], 16) / 255,
        Number.parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1]
}

const getAnchorAndDir = (
  origin: RaysOrigin,
  w: number,
  h: number,
): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2
  switch (origin) {
    case 'top-left': {
      return { anchor: [0, -outside * h], dir: [0, 1] }
    }
    case 'top-right': {
      return { anchor: [w, -outside * h], dir: [0, 1] }
    }
    case 'left': {
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] }
    }
    case 'right': {
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] }
    }
    case 'bottom-left': {
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] }
    }
    case 'bottom-center': {
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] }
    }
    case 'bottom-right': {
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] }
    }
    default: {
      // "top-center"
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] }
    }
  }
}

export const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = 'top-center',
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1,
  saturation = 1,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0,
  distortion = 0,
  edgeFadeLeft = 40,
  edgeFadeRight = 40,
  edgeFadeTop = 20,
  edgeFadeBottom = 160,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const uniformsRef = useRef<any>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 })
  const animationIdRef = useRef<number | null>(null)
  const meshRef = useRef<any>(null)
  const cleanupFunctionRef = useRef<(() => void) | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const isDark = useIsDark()
  const effectiveRaysColor =
    !isDark && raysColor === DEFAULT_COLOR ? '#ff5c00' : raysColor

  useEffect(() => {
    if (!containerRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    observerRef.current.observe(containerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current()
      cleanupFunctionRef.current = null
    }

    const initializeWebGL = async () => {
      if (!containerRef.current) return

      // Ensure layout is ready without lingering timers
      await Promise.resolve()

      if (!containerRef.current) return

      const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true,
      })
      rendererRef.current = renderer

      const { gl } = renderer
      gl.canvas.style.width = '100%'
      gl.canvas.style.height = '100%'
      gl.canvas.style.backgroundColor = 'transparent'
      gl.canvas.style.mixBlendMode = isDark ? 'normal' : 'plus-lighter'

      while (containerRef.current.firstChild) {
        containerRef.current.firstChild.remove()
      }
      containerRef.current.append(gl.canvas)

      const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

      const frag = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
uniform float globalOpacity;
uniform float alphaCutoff;

// Per-edge feathering (in device pixels)
uniform float edgeFadeLeft;
uniform float edgeFadeRight;
uniform float edgeFadeTop;
uniform float edgeFadeBottom;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  // Allow rays to fully fade to 0 to avoid gray/dark wash in light themes
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.0, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = vec4(1.0);
  float intensity = (rays1.a * 0.5 + rays2.a * 0.4);
  fragColor.rgb = vec3(intensity);
  fragColor.a = intensity;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  // Subtle vertical brightening without color channel darkening
  float brightness = 1.0 - (coord.y / iResolution.y);
  float brightnessScale = mix(0.7, 1.0, brightness);
  fragColor.rgb *= brightnessScale;

  // Remove grayscale mixing which could introduce unintended dark hues

  // Apply rays color as a tint while preserving brightness
  fragColor.rgb = mix(fragColor.rgb, fragColor.rgb * raysColor, 0.8);

  // Thin out low-intensity areas to avoid gray wash; then apply global opacity
  float a = fragColor.a;
  a = smoothstep(alphaCutoff, alphaCutoff + 0.2, a);
  fragColor.a = a * globalOpacity;

  // Per-edge feather to avoid harsh clipping at container boundaries
  float fadeL = smoothstep(0.0, edgeFadeLeft, fragCoord.x);
  float fadeR = smoothstep(0.0, edgeFadeRight, iResolution.x - fragCoord.x);
  float fadeT = smoothstep(0.0, edgeFadeTop, fragCoord.y);
  float fadeB = smoothstep(0.0, edgeFadeBottom, iResolution.y - fragCoord.y);
  fragColor.a *= fadeL * fadeR * fadeT * fadeB;
  
  // Keep additive look; no extra premultiplying which can dim highlights under plus-lighter
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`

      const baseOpacity = isDark ? 0.55 : 0.22
      const baseCutoff = isDark ? 0.08 : 0.18

      const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },

        rayPos: { value: [0, 0] },
        rayDir: { value: [0, 1] },

        raysColor: { value: hexToRgb(effectiveRaysColor) },
        raysSpeed: { value: raysSpeed },
        lightSpread: { value: lightSpread },
        rayLength: { value: rayLength },
        pulsating: { value: pulsating ? 1 : 0 },
        fadeDistance: { value: fadeDistance },
        saturation: { value: saturation },
        mousePos: { value: [0.5, 0.5] },
        mouseInfluence: { value: mouseInfluence },
        noiseAmount: { value: noiseAmount },
        distortion: { value: distortion },
        globalOpacity: { value: baseOpacity },
        alphaCutoff: { value: baseCutoff },
        edgeFadeLeft: { value: 40 },
        edgeFadeRight: { value: 40 },
        edgeFadeTop: { value: 20 },
        edgeFadeBottom: { value: 160 },
      }
      uniformsRef.current = uniforms

      const geometry = new Triangle(gl)
      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms,
      })
      const mesh = new Mesh(gl, { geometry, program })
      meshRef.current = mesh

      const updatePlacement = () => {
        if (!containerRef.current || !renderer) return

        renderer.dpr = Math.min(window.devicePixelRatio, 2)

        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current
        renderer.setSize(wCSS, hCSS)

        const { dpr } = renderer
        const w = wCSS * dpr
        const h = hCSS * dpr

        uniforms.iResolution.value = [w, h]

        // Scale edge feather from CSS pixels to device pixels
        uniforms.edgeFadeLeft.value = edgeFadeLeft * dpr
        uniforms.edgeFadeRight.value = edgeFadeRight * dpr
        uniforms.edgeFadeTop.value = edgeFadeTop * dpr
        uniforms.edgeFadeBottom.value = edgeFadeBottom * dpr

        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h)
        uniforms.rayPos.value = anchor
        uniforms.rayDir.value = dir
      }

      const loop = (t: number) => {
        if (!rendererRef.current || !uniformsRef.current || !meshRef.current) {
          return
        }

        uniforms.iTime.value = t * 0.001

        if (followMouse && mouseInfluence > 0) {
          const smoothing = 0.92

          smoothMouseRef.current.x =
            smoothMouseRef.current.x * smoothing +
            mouseRef.current.x * (1 - smoothing)
          smoothMouseRef.current.y =
            smoothMouseRef.current.y * smoothing +
            mouseRef.current.y * (1 - smoothing)

          uniforms.mousePos.value = [
            smoothMouseRef.current.x,
            smoothMouseRef.current.y,
          ]
        }

        try {
          renderer.render({ scene: mesh })
          animationIdRef.current = requestAnimationFrame(loop)
        } catch (error) {
          console.warn('WebGL rendering error:', error)
        }
      }

      updatePlacement()
      animationIdRef.current = requestAnimationFrame(loop)

      cleanupFunctionRef.current = () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
          animationIdRef.current = null
        }

        if (renderer) {
          try {
            const { canvas } = renderer.gl
            const loseContextExt =
              renderer.gl.getExtension('WEBGL_lose_context')
            if (loseContextExt) {
              loseContextExt.loseContext()
            }

            if (canvas && canvas.parentNode) {
              canvas.remove()
            }
          } catch (error) {
            console.warn('Error during WebGL cleanup:', error)
          }
        }

        rendererRef.current = null
        uniformsRef.current = null
        meshRef.current = null
      }
    }

    initializeWebGL()

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current()
        cleanupFunctionRef.current = null
      }
    }
  }, [
    isVisible,
    raysOrigin,
    raysColor,
    effectiveRaysColor,
    isDark,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    edgeFadeLeft,
    edgeFadeRight,
    edgeFadeTop,
    edgeFadeBottom,
  ])

  useEffect(() => {
    const renderer = rendererRef.current
    const uniforms = uniformsRef.current
    if (!isVisible || !renderer || !containerRef.current || !uniforms) return

    const handleResize = () => {
      if (!containerRef.current) return
      renderer.dpr = Math.min(window.devicePixelRatio, 2)
      const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current
      renderer.setSize(wCSS, hCSS)

      const { dpr } = renderer
      const w = wCSS * dpr
      const h = hCSS * dpr

      uniforms.iResolution.value = [w, h]

      // Update edge feather values on resize (scale with DPR)
      uniforms.edgeFadeLeft.value = edgeFadeLeft * dpr
      uniforms.edgeFadeRight.value = edgeFadeRight * dpr
      uniforms.edgeFadeTop.value = edgeFadeTop * dpr
      uniforms.edgeFadeBottom.value = edgeFadeBottom * dpr

      const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h)
      uniforms.rayPos.value = anchor
      uniforms.rayDir.value = dir
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [
    isVisible,
    raysOrigin,
    edgeFadeLeft,
    edgeFadeRight,
    edgeFadeTop,
    edgeFadeBottom,
  ])

  useEffect(() => {
    if (!uniformsRef.current || !containerRef.current || !rendererRef.current)
      return

    const u = uniformsRef.current
    const renderer = rendererRef.current

    u.raysColor.value = hexToRgb(effectiveRaysColor)
    u.raysSpeed.value = raysSpeed
    u.lightSpread.value = lightSpread
    u.rayLength.value = rayLength
    u.pulsating.value = pulsating ? 1 : 0
    u.fadeDistance.value = fadeDistance
    u.saturation.value = saturation
    u.mouseInfluence.value = mouseInfluence
    u.noiseAmount.value = noiseAmount
    u.distortion.value = distortion
    u.globalOpacity.value = isDark ? 0.55 : 0.22
    u.alphaCutoff.value = isDark ? 0.08 : 0.18

    // Edge feather uniforms (scale with DPR)
    u.edgeFadeLeft.value = edgeFadeLeft * renderer.dpr
    u.edgeFadeRight.value = edgeFadeRight * renderer.dpr
    u.edgeFadeTop.value = edgeFadeTop * renderer.dpr
    u.edgeFadeBottom.value = edgeFadeBottom * renderer.dpr

    const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current
    const { dpr } = renderer
    const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr)
    u.rayPos.value = anchor
    u.rayDir.value = dir
  }, [
    raysColor,
    isDark,
    effectiveRaysColor,
    raysSpeed,
    lightSpread,
    raysOrigin,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
    edgeFadeLeft,
    edgeFadeRight,
    edgeFadeTop,
    edgeFadeBottom,
  ])

  useEffect(() => {
    if (!rendererRef.current) return
    const { gl } = rendererRef.current
    gl.canvas.style.mixBlendMode = isDark ? 'normal' : 'plus-lighter'
  }, [isDark])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !rendererRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      mouseRef.current = { x, y }
    }

    if (followMouse) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [followMouse])

  return (
    <div
      ref={containerRef}
      className={clsxm(
        'w-full h-full pointer-events-none overflow-hidden relative',
        className,
      )}
    />
  )
}
