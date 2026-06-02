const icons = [
  { src: "/icons/bell.svg", label: "Bell" },
  { src: "/icons/card.svg", label: "Credit card" },
  { src: "/icons/calendar.svg", label: "Calendar" },
  { src: "/icons/chart.svg", label: "Chart" },
  { src: "/icons/divider-glow.svg", label: "Divider", wide: true },
];

export default function IconShowcase() {
  return (
    <section
      style={{
        background: "#0c0e1c",
        color: "#f0f0f5",
        padding: "32px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {icons.map((icon) => (
          <figure
            key={icon.src}
            style={{
              margin: 0,
              display: "grid",
              placeItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: icon.wide ? "180px" : "56px",
                height: "56px",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(212,168,67,0.18)",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(212,168,67,0.06))",
                boxShadow: "0 0 28px rgba(212,168,67,0.12)",
              }}
            >
              <img
                src={icon.src}
                alt={`${icon.label} icon`}
                style={{
                  width: icon.wide ? "150px" : "30px",
                  height: icon.wide ? "18px" : "30px",
                  objectFit: "contain",
                }}
              />
            </div>
            <figcaption style={{ color: "#7a8299", fontSize: "12px" }}>
              {icon.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
