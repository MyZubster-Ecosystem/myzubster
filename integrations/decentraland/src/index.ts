import { engine, Material, MeshCollider, MeshRenderer, TextShape, Transform } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

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

const markers: MyZubsterMarker[] = [
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

export function main() {
  const rendered: string[] = []

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
      text: `MyZubster\n${marker.kind}\n${marker.id}`,
      fontSize: 2,
      textColor: Color4.White(),
      outlineColor: Color4.Black(),
      outlineWidth: 0.15
    })

    rendered.push(marker.id)
    console.log(
      `[MyZubster/Decentraland] rendered ${marker.id} | ${marker.kind} | ${marker.title} | verified=${marker.provenance.verified}`
    )
  }

  console.log(`[MyZubster/Decentraland] rendered ${rendered.length} SDK7 markers: ${rendered.join(', ')}`)
}
