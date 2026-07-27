import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './cover.css'

/*
 * 원본 docs/koslink-cover-3d.html은 색 관리가 없던 three.js r128을 CDN으로
 * 로드했다. 최신 three는 sRGB↔linear 색 변환과 물리 기반 광량 스케일을
 * 기본으로 켜두기 때문에, 원본과 동일한 hex/광량 값을 그대로 써도 채도가
 * 빠지고 탁해 보인다. 원본과 동일한 색감을 내려면 레거시 색 파이프라인으로
 * 되돌려야 한다.
 */
THREE.ColorManagement.enabled = false

interface CoverScreenProps {
  onEnter: () => void
}

type NodeType = 'fall' | 'pass' | 'rise' | 'root'

interface GraphNode {
  p: THREE.Vector3
  r: number
  type: NodeType
  parent: number
  tier: number
  birth: number
  scaleCur: number
  cur: THREE.Vector3
  flash: number
  rphase: number
}

interface GraphEdge {
  a: number
  b: number
  tier: number
  birth: number
  rr: number
}

/**
 * docs/koslink-cover-3d.html의 Three.js 인트로를 그대로 옮긴 컴포넌트.
 * 애니메이션 로직은 원본 스크립트를 최대한 그대로 유지하고, DOM 접근만
 * document.getElementById → ref로, CDN 스크립트 → npm import로 바꿨다.
 * 원본은 페이지 수명 내내 정리(dispose)가 필요 없었지만 이 컴포넌트는
 * 진입 후 언마운트되므로 WebGL 리소스 해제를 추가했다.
 */
export default function CoverScreen({ onEnter }: CoverScreenProps) {
  const glRef = useRef<HTMLCanvasElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const shineRef = useRef<HTMLSpanElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaButtonRef = useRef<HTMLButtonElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const onEnterRef = useRef(onEnter)
  useEffect(() => {
    onEnterRef.current = onEnter
  }, [onEnter])

  useEffect(() => {
    const canvas = glRef.current!
    const scrimEl = scrimRef.current!
    const flashEl = flashRef.current!
    const stageEl = stageRef.current!
    const titleEl = titleRef.current!
    const shineEl = shineRef.current!
    const subEl = subRef.current!
    const descEl = descRef.current!
    const ctaEl = ctaRef.current!
    const ctaButtonEl = ctaButtonRef.current!
    const skipEl = skipRef.current!
    const hintEl = hintRef.current!

    const cancelled = { current: false }
    let rafHandle = 0
    const timeouts: Array<ReturnType<typeof setTimeout>> = []
    function schedule(fn: () => void, ms: number) {
      timeouts.push(setTimeout(fn, ms))
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    /* r128은 출력에 sRGB 감마 인코딩을 적용하지 않았다 — 최신 three의 기본
     * SRGBColorSpace 출력을 끄고 선형 그대로 내보내야 원본과 같은 밝기가 된다. */
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf6f1eb, 0.024)
    const cam = new THREE.PerspectiveCamera(
      56,
      innerWidth / innerHeight,
      0.1,
      140,
    )
    function resize() {
      renderer.setSize(innerWidth, innerHeight)
      cam.aspect = innerWidth / innerHeight
      cam.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    /*
     * 원본(r128)은 물리 기반 조명 이전 버전이라 AmbientLight/DirectionalLight
     * 세기가 확산광에 그대로 곱해졌다. 최신 three는 Lambert 확산광 BRDF를
     * 항상 π로 나누는 물리 기반 계산을 적용하므로, 같은 세기 값을 그대로
     * 쓰면 원본보다 훨씬 어둡고 탁해 보인다(실측: 동일 조건에서 출력이
     * 1/π배). 모든 조명 세기에 π를 곱해 원본 채도/명도를 복원한다.
     */
    const LIGHT_PI = Math.PI
    /* 대비를 높인 조명 → 윗면 밝고 옆면 그늘, 웅장한 입체감 */
    scene.add(new THREE.AmbientLight(0xfff2e8, 0.62 * LIGHT_PI))
    const dir = new THREE.DirectionalLight(0xffffff, 1.15 * LIGHT_PI)
    dir.position.set(1.1, 1.7, 0.8)
    scene.add(dir)
    const fill = new THREE.DirectionalLight(0xffe6d2, 0.28 * LIGHT_PI)
    fill.position.set(-1, 0.1, -0.7)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffd9b8, 0.35 * LIGHT_PI)
    rim.position.set(0.2, -0.8, -1)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)
    renderer.sortObjects = true

    /* ── 노드 뒤의 은은한 안개 ── */
    function makeMistTexture() {
      const c = document.createElement('canvas')
      c.width = c.height = 256
      const g = c.getContext('2d')!
      const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
      grad.addColorStop(0, 'rgba(255,250,246,.78)')
      grad.addColorStop(0.38, 'rgba(242,206,177,.22)')
      grad.addColorStop(1, 'rgba(242,206,177,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 256, 256)
      return new THREE.CanvasTexture(c)
    }

    const mistTexture = makeMistTexture()
    const mistMaterialA = new THREE.SpriteMaterial({
      map: mistTexture,
      color: 0xfff7f0,
      transparent: true,
      opacity: 0.2,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    const mistMaterialB = new THREE.SpriteMaterial({
      map: mistTexture,
      color: 0xf4c6a2,
      transparent: true,
      opacity: 0.1,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    const worldMistA = new THREE.Sprite(mistMaterialA)
    worldMistA.position.set(0, 0.2, -10.8)
    worldMistA.scale.set(19, 10.4, 1)
    worldMistA.renderOrder = -20
    root.add(worldMistA)
    const worldMistB = new THREE.Sprite(mistMaterialB)
    worldMistB.position.set(0.8, -0.15, -12.2)
    worldMistB.scale.set(15.5, 8.2, 1)
    worldMistB.renderOrder = -20
    root.add(worldMistB)

    /* ─ 구조: 중앙 종목에서 관계가 계층적으로 뻗어나감 ─ */
    const nodes: Array<GraphNode> = [
      {
        p: new THREE.Vector3(0, 0, 0),
        r: 1.0,
        type: 'root',
        parent: -1,
        tier: 0,
        birth: 0,
        scaleCur: 0,
        cur: new THREE.Vector3(0, 0, 0),
        flash: 0,
        rphase: 0,
      },
    ]
    function pickType(): NodeType {
      const x = Math.random()
      if (x < 0.22) return 'fall'
      if (x < 0.42) return 'pass'
      return 'rise'
    }
    function grow(
      count: number,
      radius: number,
      tier: number,
      rad: number,
      jit: number,
    ) {
      const parents = nodes
        .map((n, i) => ({ n, i }))
        .filter((o) => o.n.tier === tier - 1)
      const inc = Math.PI * (3 - Math.sqrt(5))
      for (let i = 0; i < count; i++) {
        const y = i * (2 / count) - 1 + 1 / count
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        const phi = i * inc
        const v = new THREE.Vector3(
          Math.cos(phi) * r,
          y,
          Math.sin(phi) * r,
        ).multiplyScalar(radius)
        v.multiplyScalar(1 + (Math.random() - 0.5) * jit)
        let pi = parents[0].i
        let bd = 1e9
        parents.forEach((o) => {
          const d = o.n.p.distanceTo(v)
          if (d < bd) {
            bd = d
            pi = o.i
          }
        })
        nodes.push({
          p: v,
          r: rad,
          type: pickType(),
          tier,
          parent: pi,
          birth: 0,
          scaleCur: 0,
          cur: v.clone(),
          flash: 0,
          rphase: 0,
        })
      }
    }
    grow(7, 4.8, 1, 0.54, 0.3)
    grow(12, 8.2, 2, 0.37, 0.36)
    grow(16, 11.4, 3, 0.26, 0.42)

    const edges: Array<GraphEdge> = []
    for (let i = 1; i < nodes.length; i++)
      edges.push({
        a: nodes[i].parent,
        b: i,
        tier: nodes[i].tier,
        birth: 0,
        rr: 0,
      })
    for (let i = 1; i < nodes.length; i++) {
      if (Math.random() < 0.12)
        for (let j = 1; j < nodes.length; j++) {
          if (
            j !== i &&
            nodes[j].tier === nodes[i].tier &&
            nodes[i].p.distanceTo(nodes[j].p) < nodes[i].p.length() * 0.6
          ) {
            edges.push({ a: i, b: j, tier: nodes[i].tier, birth: 0, rr: 0 })
            break
          }
        }
    }

    /* ── 배경 별먼지 ── */
    function dustBgTex() {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')!
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grd.addColorStop(0, 'rgba(255,250,244,1)')
      grd.addColorStop(0.16, 'rgba(255,232,210,.96)')
      grd.addColorStop(0.42, 'rgba(219,144,86,.66)')
      grd.addColorStop(1, 'rgba(219,144,86,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    }
    const dustBgPalette = [
      new THREE.Color(0xd78349),
      new THREE.Color(0xc96e37),
      new THREE.Color(0xb65c2c),
      new THREE.Color(0xde9c68),
      new THREE.Color(0xa85b35),
    ]
    const pc = 240
    const ppos = new Float32Array(pc * 3)
    const pcol = new Float32Array(pc * 3)
    for (let i = 0; i < pc; i++) {
      ppos[i * 3] = (Math.random() - 0.5) * 38
      ppos[i * 3 + 1] = (Math.random() - 0.5) * 24
      ppos[i * 3 + 2] = (Math.random() - 0.5) * 24
      const col = dustBgPalette[(Math.random() * dustBgPalette.length) | 0]
      pcol[i * 3] = col.r
      pcol[i * 3 + 1] = col.g
      pcol[i * 3 + 2] = col.b
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(pcol, 3))
    const dustTexture = dustBgTex()
    const dustMaterial = new THREE.PointsMaterial({
      map: dustTexture,
      vertexColors: true,
      size: 0.078,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      alphaTest: 0.02,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const dust = new THREE.Points(pGeo, dustMaterial)
    scene.add(dust)

    /* 타이밍 — 노드/엣지가 자라나는 도입부 전체를 이 배율로 압축한다
     * (1.0 = 원본 속도, 작을수록 빠르게 진행). 이 상수 하나만 바꾸면
     * 티어 등장 간격·성장 시간·타이틀 등장 시점·카메라 접근까지 함께 빨라진다. */
    const INTRO_SPEED = 0.65
    const T_TIER = [0.4, 1.6, 3.2, 4.8].map((t) => t * INTRO_SPEED)
    const GROW = 0.9 * INTRO_SPEED
    nodes.forEach((n, i) => {
      n.birth =
        T_TIER[n.tier] + ((i * 0.05 * INTRO_SPEED) % (0.9 * INTRO_SPEED))
      n.scaleCur = 0
      n.cur = n.p.clone()
      n.flash = 0
      n.rphase = Math.random() * 6.28
    })
    edges.forEach((e) => {
      e.birth =
        Math.max(nodes[e.a].birth, nodes[e.b].birth) + 0.05 * INTRO_SPEED
    })

    /* ── 노드 = 라운드 처리된 3D 박스 (ExtrudeGeometry 베벨) ── */
    function roundedRectShape(w: number, h: number, r: number) {
      const s = new THREE.Shape()
      const x = -w / 2
      const y = -h / 2
      s.moveTo(x + r, y)
      s.lineTo(x + w - r, y)
      s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
      s.lineTo(x + w, y + h - r)
      s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
      s.lineTo(x + r, y + h)
      s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
      s.lineTo(x, y + r)
      s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
      return s
    }
    const boxShape = roundedRectShape(1.42, 0.98, 0.3)

    /*
     * absarc()의 시작점/끝점은 sin·cos 부동소수점 오차 때문에 직선의 끝점과
     * 완전히 같은 좌표가 아닐 수 있다. ExtrudeGeometry의 bevel 계산에 거의
     * 겹친 두 점이 들어가면 한 정점이 멀리 뻗는 삼각형 아티팩트가 생긴다.
     * geometry 생성 직전에 1e-7보다 가까운 점만 제거한다.
     */
    const extractBoxPoints = boxShape.extractPoints.bind(boxShape)
    boxShape.extractPoints = function (divisions: number) {
      const data = extractBoxPoints(divisions)
      const removeNearDuplicates = (points: Array<THREE.Vector2>) => {
        const EPS_SQ = 1e-14
        const cleaned: Array<THREE.Vector2> = []
        points.forEach((point) => {
          if (
            cleaned.length === 0 ||
            cleaned[cleaned.length - 1].distanceToSquared(point) > EPS_SQ
          )
            cleaned.push(point)
        })
        if (
          cleaned.length > 2 &&
          cleaned[0].distanceToSquared(cleaned[cleaned.length - 1]) <= EPS_SQ
        ) {
          cleaned.pop()
        }
        return cleaned
      }
      data.shape = removeNearDuplicates(data.shape)
      data.holes = data.holes.map(removeNearDuplicates)
      return data
    }

    const geoBox = new THREE.ExtrudeGeometry(boxShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 10,
    })
    geoBox.center()

    const BOXCOL: Record<NodeType, THREE.Color> = {
      rise: new THREE.Color(0xf26722),
      fall: new THREE.Color(0x0e6e96),
      pass: new THREE.Color(0xebae82),
      root: new THREE.Color(0xf4712a),
    }
    const SCALE = 2.9
    const matBox = new THREE.MeshLambertMaterial({})
    const inst = new THREE.InstancedMesh(geoBox, matBox, nodes.length)
    const dummy = new THREE.Object3D()
    nodes.forEach((n, i) => {
      dummy.position.copy(n.p)
      dummy.scale.setScalar(0.001)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
      inst.setColorAt(i, BOXCOL[n.type])
    })
    root.add(inst)

    /* ── 엣지 = 굵은 3D 실린더 ── */
    const ECOL: Record<NodeType, THREE.Color> = {
      rise: new THREE.Color(0xf3873f),
      fall: new THREE.Color(0x1e88b2),
      pass: new THREE.Color(0xd8c4b0),
      root: new THREE.Color(0xf3873f),
    }
    const geoEdge = new THREE.CylinderGeometry(1, 1, 1, 10, 1)
    const matEdge = new THREE.MeshLambertMaterial({})
    const instEdge = new THREE.InstancedMesh(geoEdge, matEdge, edges.length)
    edges.forEach((e, i) => {
      e.rr = e.tier === 1 ? 0.032 : e.tier === 2 ? 0.023 : 0.016
      instEdge.setColorAt(i, ECOL[nodes[e.b].type])
    })
    root.add(instEdge)
    const YAXIS = new THREE.Vector3(0, 1, 0)
    const qE = new THREE.Quaternion()
    const midE = new THREE.Vector3()
    const dirE = new THREE.Vector3()
    const endE = new THREE.Vector3()
    const dumE = new THREE.Object3D()

    /* 신호 입자 */
    function dotTex() {
      const c = document.createElement('canvas')
      c.width = c.height = 48
      const g = c.getContext('2d')!
      const grd = g.createRadialGradient(24, 24, 0, 24, 24, 24)
      grd.addColorStop(0, 'rgba(255,255,255,1)')
      grd.addColorStop(0.55, 'rgba(255,240,225,.95)')
      grd.addColorStop(1, 'rgba(255,200,150,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, 48, 48)
      return new THREE.CanvasTexture(c)
    }
    const flowPos = new Float32Array(edges.length * 3)
    const flowGeo = new THREE.BufferGeometry()
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3))
    const flowTexture = dotTex()
    const flowMaterial = new THREE.PointsMaterial({
      color: 0xfff1e4,
      size: 0.42,
      map: flowTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const flow = new THREE.Points(flowGeo, flowMaterial)
    root.add(flow)

    /* ── 타임라인 ── */
    let t0: number | null = null
    let entered = false
    let done = false
    let enterK = 0
    const clamp = (x: number) => Math.max(0, Math.min(1, x))
    const eOut = (x: number) => 1 - Math.pow(1 - x, 3)
    const eIO = (x: number) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    const eBack = (x: number) => {
      const c = 1.9
      return 1 + 2.9 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
    }

    const TEXT_AT = 6.2 * INTRO_SPEED
    function showEl(el: HTMLElement, ms: number) {
      schedule(() => {
        el.style.transition =
          'opacity 1s, transform 1.1s cubic-bezier(.16,.8,.2,1), filter .9s'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        el.style.filter = 'blur(0)'
      }, ms)
    }
    function fireText() {
      titleEl.querySelectorAll<HTMLElement>('.ch').forEach((c, i) => {
        schedule(
          () => {
            c.style.transition =
              'opacity .9s, transform 1s cubic-bezier(.16,.8,.2,1), filter .8s'
            c.style.opacity = '1'
            c.style.transform = 'translateY(0) rotateX(0) scale(1)'
            c.style.filter = 'blur(0)'
          },
          TEXT_AT * 1000 + i * 95,
        )
      })
      /* 타이틀 등장과 함께 3D 배경 블러 → 그래프를 뒤로 */
      schedule(
        () => {
          canvas.classList.add('blur')
          scrimEl.classList.add('on')
        },
        TEXT_AT * 1000 + 250,
      )
      schedule(
        () => {
          shineEl.classList.add('go')
          titleEl.classList.add('lit')
        },
        TEXT_AT * 1000 + 900,
      )
      showEl(subEl, TEXT_AT * 1000 + 1300)
      showEl(descEl, TEXT_AT * 1000 + 1700)
      showEl(ctaEl, TEXT_AT * 1000 + 2200)
      schedule(() => hintEl.classList.add('on'), TEXT_AT * 1000 + 2900)
    }

    const va = new THREE.Vector3()
    const vc = new THREE.Vector3()
    const tiltE = new THREE.Euler()
    const tiltQ = new THREE.Quaternion()

    function onEntered() {
      onEnterRef.current()
    }

    function frame(ts: number) {
      if (cancelled.current) return
      if (t0 === null) {
        t0 = ts
        fireText()
      }
      const t = (ts - t0) / 1000

      /* 시네마틱 카메라 (노드 빌보드보다 먼저 계산) */
      if (!entered) {
        const approach = eIO(clamp(t / (6.5 * INTRO_SPEED)))
        const dist = 27 - approach * 8
        const ang = t * 0.085
        const height = Math.sin(t * 0.14) * 2.3
        cam.position.set(
          Math.sin(ang) * dist * 0.35,
          height,
          Math.cos(ang * 0.6) * dist,
        )
        const rec = eIO(clamp((t - TEXT_AT) / (1.2 * INTRO_SPEED)))
        cam.position.z += rec * 4
        cam.position.y += rec * 0.8
        cam.lookAt(0, rec * 0.4, 0)
        root.position.y = rec * 0.4
      }

      /* 노드 성장 */
      nodes.forEach((n, i) => {
        const raw = clamp((t - n.birth) / GROW)
        const k = eOut(raw)
        n.scaleCur = n.r * (n.type === 'root' ? k : eBack(k))
        if (n.parent >= 0) {
          va.copy(nodes[n.parent].cur)
          vc.copy(va).lerp(n.p, k)
        } else vc.copy(n.p)
        n.cur.copy(vc)
        if (raw > 0 && raw < 0.5) n.flash = Math.max(n.flash, 1 - raw * 2)
        n.flash *= 0.9
        const pulse = 1 + Math.sin(t * 1.4 + i) * 0.03 + n.flash * 0.35
        dummy.position.copy(n.cur)
        tiltE.set(
          Math.sin(t * 0.5 + n.rphase) * 0.09,
          Math.cos(t * 0.42 + n.rphase) * 0.09,
          0,
        )
        tiltQ.setFromEuler(tiltE)
        dummy.quaternion.copy(cam.quaternion).multiply(tiltQ)
        dummy.scale.setScalar(Math.max(0.001, n.scaleCur * SCALE * pulse))
        dummy.updateMatrix()
        inst.setMatrixAt(i, dummy.matrix)
      })
      inst.instanceMatrix.needsUpdate = true

      /* 엣지 성장 */
      edges.forEach((e, i) => {
        const na = nodes[e.a]
        const nb = nodes[e.b]
        const k = eOut(clamp((t - e.birth) / (0.6 * INTRO_SPEED)))
        endE.copy(na.cur).lerp(nb.cur, k)
        dirE.subVectors(endE, na.cur)
        const len = dirE.length()
        if (len < 1e-3) {
          dumE.scale.set(0.0001, 0.0001, 0.0001)
          dumE.position.copy(na.cur)
          dumE.rotation.set(0, 0, 0)
        } else {
          dirE.multiplyScalar(1 / len)
          qE.setFromUnitVectors(YAXIS, dirE)
          midE.copy(na.cur).add(endE).multiplyScalar(0.5)
          dumE.position.copy(midE)
          dumE.quaternion.copy(qE)
          dumE.scale.set(e.rr, len, e.rr)
        }
        dumE.updateMatrix()
        instEdge.setMatrixAt(i, dumE.matrix)
      })
      instEdge.instanceMatrix.needsUpdate = true

      /* 신호 입자 */
      let fi = 0
      edges.forEach((e, idx) => {
        const na = nodes[e.a]
        const nb = nodes[e.b]
        const born = clamp((t - e.birth) / (0.6 * INTRO_SPEED))
        const u = (t * 0.32 + idx * 0.13) % 1
        vc.copy(na.cur).lerp(nb.cur, u * born)
        flowPos[fi++] = vc.x
        flowPos[fi++] = vc.y
        flowPos[fi++] = vc.z
      })
      flowGeo.attributes.position.needsUpdate = true
      flowMaterial.opacity =
        clamp((t - 2.0 * INTRO_SPEED) / (2 * INTRO_SPEED)) * 0.9

      dustMaterial.opacity =
        clamp((t - 1.0 * INTRO_SPEED) / (2 * INTRO_SPEED)) * 0.72

      /* 진입 → 중심으로 돌진, 블러 해제 후 화이트아웃 */
      if (entered) {
        enterK = Math.min(1, enterK + 0.014)
        const e = eIO(enterK)
        const d = cam.position.length()
        cam.position.multiplyScalar((d - e * d * 0.9) / d)
        cam.lookAt(0, 0, 0)
        ;(scene.fog as THREE.FogExp2).density = 0.024 + e * 0.06
        stageEl.style.opacity = String(1 - Math.min(1, enterK * 1.5))
        stageEl.style.transform = `scale(${1 + e * 0.2})`
        flashEl.style.opacity = String(clamp((enterK - 0.5) / 0.5))
        if (enterK >= 1 && !done) {
          done = true
          onEntered()
        }
      }

      renderer.render(scene, cam)
      rafHandle = requestAnimationFrame(frame)
    }
    rafHandle = requestAnimationFrame(frame)

    function startEnter() {
      if (entered) return
      entered = true
      hintEl.classList.remove('on')
      canvas.classList.remove('blur')
      scrimEl.classList.remove('on')
    }
    function handleSkip() {
      titleEl.querySelectorAll<HTMLElement>('.ch').forEach((c) => {
        c.style.transition = 'none'
        c.style.opacity = '1'
        c.style.transform = 'none'
        c.style.filter = 'none'
      })
      ;[subEl, descEl, ctaEl].forEach((el) => {
        el.style.transition = 'none'
        el.style.opacity = '1'
        el.style.transform = 'none'
        el.style.filter = 'none'
      })
      shineEl.classList.add('go')
      titleEl.classList.add('lit')
      canvas.classList.add('blur')
      scrimEl.classList.add('on')
      if (t0 !== null) t0 = performance.now() - TEXT_AT * 1000
    }

    ctaButtonEl.addEventListener('click', startEnter)
    skipEl.addEventListener('click', handleSkip)

    return () => {
      cancelled.current = true
      cancelAnimationFrame(rafHandle)
      window.removeEventListener('resize', resize)
      ctaButtonEl.removeEventListener('click', startEnter)
      skipEl.removeEventListener('click', handleSkip)
      timeouts.forEach((id) => clearTimeout(id))

      geoBox.dispose()
      matBox.dispose()
      geoEdge.dispose()
      matEdge.dispose()
      pGeo.dispose()
      dustMaterial.dispose()
      dustTexture.dispose()
      flowGeo.dispose()
      flowMaterial.dispose()
      flowTexture.dispose()
      mistTexture.dispose()
      mistMaterialA.dispose()
      mistMaterialB.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="koslink-cover">
      <div className="dots" />
      <div className="hero" />
      <div className="back-mist" />
      <canvas ref={glRef} className="gl" />
      <div className="vignette" />
      <div ref={scrimRef} className="scrim" />
      <div className="grain" />
      <div className="fadein" />
      <div ref={flashRef} className="flash" />
      <button ref={skipRef} className="skip" type="button">
        건너뛰기
      </button>

      <div ref={stageRef} className="cover-stage">
        <h1 ref={titleRef} className="title">
          <span className="ch kos">K</span>
          <span className="ch kos">O</span>
          <span className="ch kos">S</span>
          <span className="ch link">L</span>
          <span className="ch link">I</span>
          <span className="ch link">N</span>
          <span className="ch link">K</span>
          <span ref={shineRef} className="shine" />
        </h1>
        <p ref={subRef} className="sub">
          뉴스는 한 종목에서 멈추지 않는다
        </p>
        <p ref={descRef} className="desc">
          온톨로지 AI가 뉴스와 종목의 관계를 연결해,{' '}
          <b>어떤 종목이 오르고 내릴지</b> 그 이유까지 보여줍니다.
        </p>
        <div ref={ctaRef} className="cta">
          <div className="glow" />
          <button ref={ctaButtonRef} type="button">
            관계망 탐색하기 <span className="arrow">→</span>
          </button>
        </div>
      </div>
      <div ref={hintRef} className="hint">
        버튼을 눌러 시작합니다
      </div>
    </div>
  )
}
