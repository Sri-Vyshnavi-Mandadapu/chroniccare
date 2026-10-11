import { useRef, useEffect, useState, Component } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
function Heart({ animate }) {
  const ref = useRef();
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.bezierCurveTo(-0.3, -0.65, -1.35, 0.05, -1.35, 0.75);
  shape.bezierCurveTo(-1.35, 1.6, -0.3, 1.85, 0, 1.05);
  shape.bezierCurveTo(0.3, 1.85, 1.35, 1.6, 1.35, 0.75);
  shape.bezierCurveTo(1.35, 0.05, 0.3, -0.65, 0, -1);
  useFrame(({ clock, pointer }) => {
    if (ref.current && animate) {
      ref.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.4) * 0.35 + pointer.x * 0.16;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.08;
    }
  });
  return (
    <group ref={ref} rotation={[0.05, -0.3, -0.08]}>
      <mesh position={[0, -0.1, 0]}>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.45,
              bevelEnabled: true,
              bevelSegments: 8,
              steps: 1,
              bevelSize: 0.25,
              bevelThickness: 0.25,
              curveSegments: 40,
            },
          ]}
        />
        <meshPhysicalMaterial
          color="#44bca6"
          metalness={0.32}
          roughness={0.22}
          clearcoat={1}
        />
      </mesh>
      <mesh rotation={[1.2, 0.2, -0.35]} position={[0, 0.15, 0.1]}>
        <torusGeometry args={[2.05, 0.025, 12, 100]} />
        <meshStandardMaterial
          color="#b9dcd2"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {[
        [-1.9, 0.8, 0.6],
        [1.85, -0.5, 0.7],
        [0.8, 1.9, -0.4],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i === 1 ? 0.18 : 0.11, 24, 24]} />
          <meshStandardMaterial
            color={i === 1 ? "#e8ae71" : "#73cabb"}
            metalness={0.4}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
class Boundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="heart-fallback" aria-label="Decorative heart">
        ♥
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function WellnessScene({ animate = true }) {
  const host = useRef(),
    [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) =>
      setVisible(e.isIntersecting && !document.hidden),
    );
    if (host.current) observer.observe(host.current);
    const listener = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", listener);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);
  return (
    <div
      ref={host}
      className="scene"
      aria-label="Interactive decorative 3D heart. Drag to rotate. Not a health indicator."
    >
      <Boundary>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.4, 6.7], fov: 45 }}
          frameloop={animate && visible ? "always" : "demand"}
          fallback={<div className="heart-fallback">♥</div>}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 4, 5]} intensity={3} />
          <directionalLight
            position={[-4, 1, 2]}
            color="#b7ffeb"
            intensity={2}
          />
          <Heart animate={animate && visible} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
        </Canvas>
      </Boundary>
    </div>
  );
}
