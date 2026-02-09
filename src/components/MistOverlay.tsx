const MistOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
      <div className="mist-layer mist-1" />
      <div className="mist-layer mist-2" />
      <div className="mist-layer mist-3" />

      <style>{`
        .mist-layer {
          position: absolute;
          inset: 0;
          background-repeat: repeat-x;
          background-size: 200% 100%;
          opacity: 0.12;
        }
        .mist-1 {
          background-image:
            radial-gradient(ellipse 600px 120px at 20% 80%, hsla(90, 20%, 70%, 0.5), transparent),
            radial-gradient(ellipse 500px 100px at 70% 85%, hsla(45, 30%, 80%, 0.4), transparent),
            radial-gradient(ellipse 400px 80px at 50% 75%, hsla(80, 15%, 65%, 0.3), transparent);
          animation: drift-mist 25s ease-in-out infinite;
        }
        .mist-2 {
          background-image:
            radial-gradient(ellipse 700px 90px at 60% 90%, hsla(45, 25%, 75%, 0.4), transparent),
            radial-gradient(ellipse 450px 110px at 30% 70%, hsla(90, 18%, 72%, 0.35), transparent);
          animation: drift-mist 35s ease-in-out infinite reverse;
          opacity: 0.08;
        }
        .mist-3 {
          background-image:
            radial-gradient(ellipse 550px 70px at 80% 65%, hsla(80, 20%, 80%, 0.3), transparent),
            radial-gradient(ellipse 350px 90px at 15% 85%, hsla(45, 20%, 70%, 0.25), transparent);
          animation: drift-mist 40s ease-in-out infinite;
          animation-delay: -10s;
          opacity: 0.06;
        }
        @keyframes drift-mist {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(5%) translateY(-2%); }
          50% { transform: translateX(-3%) translateY(1%); }
          75% { transform: translateX(4%) translateY(-1%); }
        }
      `}</style>
    </div>
  );
};

export default MistOverlay;
