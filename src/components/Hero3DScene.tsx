import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Box, Torus } from '@react-three/drei';
import { Suspense } from 'react';

function FloatingPhone() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={[-3, 1, 0]} rotation={[0.2, 0.3, 0]}>
        <boxGeometry args={[0.8, 1.5, 0.1]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.8} roughness={0.2} />
      </mesh>
    </Float>
  );
}

function FloatingLaptop() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group position={[3, -1, 0]} rotation={[0.1, -0.4, 0]}>
        <mesh>
          <boxGeometry args={[2, 0.1, 1.5]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.8, -0.75]} rotation={[-Math.PI / 3, 0, 0]}>
          <boxGeometry args={[2, 1.5, 0.05]} />
          <meshStandardMaterial color="#1e40af" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function FloatingBook() {
  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh position={[0, 2, -2]} rotation={[0.3, 0.5, 0.2]}>
        <boxGeometry args={[1, 1.4, 0.2]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
      </mesh>
    </Float>
  );
}

function AnimatedSphere() {
  return (
    <Float speed={1} rotationIntensity={1} floatIntensity={0.5}>
      <Sphere args={[0.5, 32, 32]} position={[-2, -2, -1]}>
        <MeshDistortMaterial
          color="#ec4899"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function AnimatedTorus() {
  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={0.6}>
      <Torus args={[0.6, 0.2, 16, 32]} position={[2, 2, -1]} rotation={[0.5, 0.5, 0]}>
        <meshStandardMaterial color="#10b981" metalness={0.7} roughness={0.3} />
      </Torus>
    </Float>
  );
}

function FloatingBox() {
  return (
    <Float speed={2.2} rotationIntensity={0.6} floatIntensity={0.9}>
      <Box args={[0.7, 0.7, 0.7]} position={[1, -2.5, 1]} rotation={[0.4, 0.4, 0.4]}>
        <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.4} />
      </Box>
    </Float>
  );
}

export function Hero3DScene() {
  return (
    <div className="absolute inset-0 opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />
          
          <FloatingPhone />
          <FloatingLaptop />
          <FloatingBook />
          <AnimatedSphere />
          <AnimatedTorus />
          <FloatingBox />
          
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
