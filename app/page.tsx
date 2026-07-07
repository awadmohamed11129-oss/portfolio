import { Hero } from "@/components/Hero";
import { ProjectTeasers } from "@/components/ProjectTeasers";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Skills } from "@/components/Skills";
import { ContactStrip } from "@/components/ContactStrip";
import { Reveal } from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectTeasers />
      <Reveal>
        <About />
      </Reveal>
      <Reveal>
        <Experience />
      </Reveal>
      <Reveal>
        <Skills />
      </Reveal>
      <Reveal>
        <ContactStrip />
      </Reveal>
    </>
  );
}
