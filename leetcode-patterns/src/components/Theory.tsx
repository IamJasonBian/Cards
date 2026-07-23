import { ExternalLink, Sigma } from "lucide-react";

type TheoryLink = {
  label: string;
  url: string;
};

type TheoryResource = {
  title: string;
  description: string;
  links: TheoryLink[];
};

const resources: TheoryResource[] = [
  {
    title: "Computers and Intractability",
    description:
      "Garey & Johnson (1979) — the classic guide to the theory of NP-completeness.",
    links: [
      {
        label: "PDF",
        url: "https://perso.limos.fr/~palafour/PAPERS/PDF/Garey-Johnson79.pdf",
      },
      {
        label: "Backup — Internet Archive",
        url: "https://archive.org/details/computersintract0000gare",
      },
      {
        label: "Backup — Open Library",
        url: "https://openlibrary.org/works/OL4295313W/Computers_and_Intractability",
      },
    ],
  },
  {
    title: "OG NP 300 List",
    description:
      "The appendix of Computers and Intractability: the original catalog of ~300 known NP-complete problems.",
    links: [
      {
        label: "OG NP 300 List",
        url: "https://perso.limos.fr/~palafour/PAPERS/PDF/Garey-Johnson79.pdf",
      },
    ],
  },
  {
    title: "SAT proof",
    description:
      "The Cook–Levin theorem: Boolean satisfiability is NP-complete — the proof that started it all.",
    links: [
      {
        label: "SAT proof",
        url: "https://en.wikipedia.org/wiki/Cook%E2%80%93Levin_theorem",
      },
    ],
  },
];

export function Theory() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Sigma className="text-cyan-600" size={28} />
          Theory
        </h1>
        <p className="text-slate-700 text-sm font-bold">
          Foundational reading on NP-completeness and computational complexity.
        </p>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.title}
            className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10 p-5"
          >
            <h2 className="text-xl font-bold text-slate-900">{resource.title}</h2>
            <p className="text-sm text-slate-700 mt-1 mb-4">{resource.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {resource.links.map((link) => (
                <a
                  key={link.url + link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-none text-xs text-slate-700 hover:bg-cyan-50 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors"
                >
                  {link.label}
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
