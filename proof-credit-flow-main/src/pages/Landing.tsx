import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Lock, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Shield, title: "Private by Default", desc: "Zero-knowledge proofs keep your data confidential while proving creditworthiness." },
    { icon: Lock, title: "Onchain Escrow", desc: "Smart contracts handle collateral, clearing, and settlement automatically." },
    { icon: Zap, title: "AI-Powered Matching", desc: "Intelligent risk assessment and term recommendations for optimal deals." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Powered by Monad • Private state by Unlink
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6">
            Programmable Credit.{" "}
            <span className="text-primary">Private by Default.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Borrow or lend using private verification and onchain execution.
          </p>

          <button onClick={() => navigate("/login")} className="glow-button text-lg px-8 py-4 flex items-center gap-3 mx-auto">
            <ArrowRight className="w-5 h-5" />
            Enter
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glow-card p-6 opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 150 + 300}ms`, animationFillMode: "forwards" }}
            >
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Statement */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm font-medium">Our Mission</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Traditional DeFi lending is broken. Nearly every protocol today demands{" "}
              <span className="text-foreground font-medium">150–200% overcollateralization</span> — locking up more value
              than you borrow. This shuts out the vast majority of real-world borrowers who need
              capital the most, turning DeFi into a playground for whales instead of a financial tool
              for everyone.
            </p>

            <p>
              <span className="text-primary font-semibold">ProofCredit changes that.</span> We're
              building the first truly undercollateralized lending marketplace on-chain, powered by
              zero-knowledge proofs and private credit verification. Your income, employment, and
              creditworthiness are verified without ever exposing your raw data — not to lenders, not
              to the protocol, not to anyone.
            </p>

            <p>
              By combining{" "}
              <span className="text-foreground font-medium">Monad's high-performance execution</span>{" "}
              with{" "}
              <span className="text-foreground font-medium">Unlink's private state infrastructure</span>,
              we enable a new class of credit markets: ones where trust is established through cryptographic
              proof rather than excessive collateral. Borrowers access fair terms, lenders get intelligent
              risk assessment, and the entire process is transparent, composable, and programmable.
            </p>

            <p>
              Our vision is a world where on-chain credit works like it should — accessible,
              private, and efficient. No gatekeepers. No data exposure. Just verifiable trust.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
