/**
 * The screen a respondent reads before starting.
 *
 * Wording follows the preamble and Significance of the Study in the
 * manuscript, so the web version and the printed instrument say the same
 * thing in the same voice. Keep it plain and formal if you edit it.
 */
export function WelcomeStep() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold leading-snug tracking-tight text-balance">
          Survey on Customer Loyalty in Fitness Firms
        </h1>
        <p className="mt-2 text-sm text-foreground/55">
          About 6 minutes. Anonymous. Your progress is saved on this device.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/75">
        <p className="font-medium text-foreground">Dear Respondent:</p>
        <p>
          You are invited to take part in a research study on customer loyalty among members of
          fitness firms in the Philippines. The study is being conducted in partial fulfillment
          of the requirements for the degree of Doctor of Philosophy in Business Administration
          at the Adventist University of the Philippines.
        </p>
        <p>
          This questionnaire aims to gather information about your experiences and perceptions as
          a member of a fitness firm. For this questionnaire, the term{" "}
          <em>fitness firm</em> refers to the commercial gym, fitness center, health club, or
          boutique fitness studio where you currently hold an active membership.
        </p>
      </div>

      <Section title="Purpose of the study">
        <p>
          The study examines how the quality of service you receive and your involvement with
          your fitness firm affect your trust in it, and how that trust in turn affects your
          decision to continue your membership and to recommend the firm to others.
        </p>
      </Section>

      <Section title="How the results will be used">
        <p className="mb-3">
          The findings will be used to develop a program enhancement for fitness firms in the
          Philippines. Owners and managers may use the results to identify which aspects of
          service quality and customer engagement require greater attention, and to improve the
          programs, policies, and service strategies that build trust, continued patronage, and
          stronger customer relationships.
        </p>
        <p className="mb-3">
          Trainers and frontline personnel may gain a clearer understanding of how their
          competence, responsiveness, professionalism, and interactions with members contribute
          to trust and loyalty.
        </p>
        <p>
          Members themselves may benefit indirectly through improved services, more engaging
          fitness activities, transparent policies, and more responsive and personalized fitness
          experiences.
        </p>
      </Section>

      <Section title="Your participation">
        <ul className="flex flex-col gap-2">
          <Bullet>
            Participation is voluntary. You may decline to answer any question or discontinue
            your participation at any time without penalty.
          </Bullet>
          <Bullet>
            Your responses will be treated confidentially and reported only in aggregate form.
          </Bullet>
          <Bullet>
            No names, email addresses, or contact numbers are collected, and no individual member
            or fitness firm will be identified.
          </Bullet>
          <Bullet>Responses will be used for academic research purposes only.</Bullet>
        </ul>
      </Section>

      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground/75">
        By tapping <span className="font-semibold text-foreground">Begin survey</span>, you
        confirm that you are at least 18 years old and agree to participate.
      </p>

      <div className="border-t border-border pt-4 text-xs leading-relaxed text-foreground/50">
        <p className="font-medium text-foreground/70">Ma. Christina L. Abrahano</p>
        <p>Doctor of Philosophy in Business Administration, Major in Business Management</p>
        <p>Graduate Business Department, Adventist University of the Philippines</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/75">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden="true"
        className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/25"
      />
      <span>{children}</span>
    </li>
  );
}
