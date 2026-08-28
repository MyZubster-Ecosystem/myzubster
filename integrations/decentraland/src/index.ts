import {
  engine,
  InputAction,
  Material,
  MeshCollider,
  MeshRenderer,
  pointerEventsSystem,
  TextShape,
  Transform
} from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'

type MarkerKind = 'place' | 'plant' | 'environment'

type MyZubsterMarker = {
  id: string
  title: string
  kind: MarkerKind
  position: Vector3
  provenance: {
    source: 'MyZubster'
    public: true
    verified: false
  }
  scientificallyValidated?: false
}

export const markers: MyZubsterMarker[] = [
  {
    id: 'myz-rimini-place-001',
    title: 'Rimini public place demo',
    kind: 'place',
    position: Vector3.create(8, 2.2, 8),
    provenance: { source: 'MyZubster', public: true, verified: false }
  },
  {
    id: 'myz-rimini-plant-001',
    title: 'Public plant observation demo',
    kind: 'plant',
    position: Vector3.create(12, 2.2, 8),
    provenance: { source: 'MyZubster', public: true, verified: false }
  },
  {
    id: 'myz-life-env-001',
    title: 'LIFE environmental marker demo',
    kind: 'environment',
    position: Vector3.create(4, 2.2, 8),
    provenance: { source: 'MyZubster', public: true, verified: false },
    scientificallyValidated: false
  }
]

function markerColor(kind: MarkerKind): Color4 {
  if (kind === 'plant') return Color4.create(0.05, 1, 0.15, 1)
  if (kind === 'environment') return Color4.create(1, 0.35, 0.02, 1)
  return Color4.create(0.02, 0.35, 1, 1)
}

function compactLabel(marker: MyZubsterMarker): string {
  return `MyZubster\n${marker.kind}\n${marker.id}\nClick for provenance`
}

function provenanceLabel(marker: MyZubsterMarker): string {
  const validation = marker.scientificallyValidated === false ? '\nscientificallyValidated=false' : ''
  return `${marker.title}\nsource=${marker.provenance.source}\npublic=${marker.provenance.public}\nverified=${marker.provenance.verified}${validation}\nClick to collapse`
}

function createGatewayButton(marker: MyZubsterMarker, x: number) {
  const button = engine.addEntity()
  Transform.create(button, {
    position: Vector3.create(x, 1.15, 3.2),
    scale: Vector3.create(1.7, 0.45, 0.75)
  })
  MeshRenderer.setBox(button)
  MeshCollider.setBox(button)
  Material.setPbrMaterial(button, {
    albedoColor: markerColor(marker.kind),
    emissiveColor: markerColor(marker.kind),
    emissiveIntensity: 0.55,
    metallic: 0,
    roughness: 0.4
  })

  const label = engine.addEntity()
  Transform.create(label, {
    parent: button,
    position: Vector3.create(0, 0.72, 0),
    scale: Vector3.create(0.55, 0.55, 0.55)
  })
  TextShape.create(label, {
    text: `${marker.kind.toUpperCase()}\n${marker.id}`,
    fontSize: 1.8,
    textColor: Color4.White(),
    outlineColor: Color4.Black(),
    outlineWidth: 0.12
  })

  pointerEventsSystem.onPointerDown(
    {
      entity: button,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: `Go to ${marker.kind} marker`,
        maxDistance: 10,
        showFeedback: true
      }
    },
    () => {
      const destination = Vector3.create(marker.position.x, 0.1, marker.position.z - 2.4)
      movePlayerTo({
        newRelativePosition: destination,
        cameraTarget: Vector3.create(marker.position.x, marker.position.y, marker.position.z)
      })
      console.log(`[MyZubster/Decentraland] gateway navigation -> ${marker.id}`)
    }
  )
}

function createGateway() {
  const frame = engine.addEntity()
  Transform.create(frame, {
    position: Vector3.create(8, 2.6, 3.55),
    scale: Vector3.create(5.8, 2.2, 0.2)
  })
  MeshRenderer.setBox(frame)
  Material.setPbrMaterial(frame, {
    albedoColor: Color4.create(0.025, 0.03, 0.055, 1),
    emissiveColor: Color4.create(0.02, 0.08, 0.18, 1),
    emissiveIntensity: 0.35,
    metallic: 0.15,
    roughness: 0.6
  })

  const title = engine.addEntity()
  Transform.create(title, {
    position: Vector3.create(8, 4.15, 3.25),
    scale: Vector3.create(0.9, 0.9, 0.9)
  })
  TextShape.create(title, {
    text: 'MYZUBSTER GATEWAY\nChoose an observation\nExperimental Decentraland interoperability',
    fontSize: 2.2,
    textColor: Color4.White(),
    outlineColor: Color4.Black(),
    outlineWidth: 0.14
  })

  createGatewayButton(markers[2], 4.6)
  createGatewayButton(markers[0], 8)
  createGatewayButton(markers[1], 11.4)

  const disclaimer = engine.addEntity()
  Transform.create(disclaimer, {
    position: Vector3.create(8, 0.45, 3.4),
    scale: Vector3.create(0.55, 0.55, 0.55)
  })
  TextShape.create(disclaimer, {
    text: 'Public demo data · unverified · no Decentraland partnership or scientific validation implied',
    fontSize: 1.4,
    textColor: Color4.White(),
    outlineColor: Color4.Black(),
    outlineWidth: 0.1
  })
}

export function main() {
  const rendered: string[] = []

  createGateway()

  for (const marker of markers) {
    const entity = engine.addEntity()

    Transform.create(entity, {
      position: marker.position,
      scale: Vector3.create(2.2, 2.2, 2.2)
    })
    MeshRenderer.setSphere(entity)
    MeshCollider.setSphere(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: markerColor(marker.kind),
      emissiveColor: markerColor(marker.kind),
      emissiveIntensity: 1,
      metallic: 0,
      roughness: 0.25
    })

    const label = engine.addEntity()
    Transform.create(label, {
      parent: entity,
      position: Vector3.create(0, 1.25, 0),
      scale: Vector3.create(0.45, 0.45, 0.45)
    })
    TextShape.create(label, {
      text: compactLabel(marker),
      fontSize: 2,
      textColor: Color4.White(),
      outlineColor: Color4.Black(),
      outlineWidth: 0.15
    })

    let expanded = false
    pointerEventsSystem.onPointerDown(
      {
        entity,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: `Inspect ${marker.kind} provenance`,
          maxDistance: 8,
          showFeedback: true
        }
      },
      () => {
        expanded = !expanded
        const text = TextShape.getMutable(label)
        text.text = expanded ? provenanceLabel(marker) : compactLabel(marker)
        console.log(
          `[MyZubster/Decentraland] provenance ${expanded ? 'opened' : 'closed'} for ${marker.id} | source=${marker.provenance.source} | public=${marker.provenance.public} | verified=${marker.provenance.verified}`
        )
      }
    )

    rendered.push(marker.id)
    console.log(
      `[MyZubster/Decentraland] rendered ${marker.id} | ${marker.kind} | ${marker.title} | verified=${marker.provenance.verified}`
    )
  }

  console.log(`[MyZubster/Decentraland] rendered ${rendered.length} SDK7 markers: ${rendered.join(', ')}`)
}
