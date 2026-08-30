'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const scenarios = {
  helium: {
    label: 'Scenario A',
    title: 'Core helium burning',
    periods: '~400/416 d fundamental · ~2100/2170 d companion/LSP',
    conclusion: 'Collapse is not imminent under this model family.',
    source: 'Joyce et al. 2020 + companion evidence',
    href: 'https://arxiv.org/abs/2006.09837',
  },
  carbon: {
    label: 'Scenario B',
    title: 'Late core carbon burning',
    periods: '~2200 d fundamental · ~420/230/185 d overtones',
    conclusion:
      'Some Saio et al. models reach carbon exhaustion in less than about 300 years.',
    source: 'Saio et al. 2023; conditional and contested',
    href: 'https://arxiv.org/abs/2306.00287',
  },
};

export function ScenarioSwitcher() {
  const [active, setActive] = useState<keyof typeof scenarios>('helium');
  const reduceMotion = useReducedMotion();
  const scenario = scenarios[active];

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        if (value === 'helium' || value === 'carbon') setActive(value);
      }}
      className="scenario-tabs"
    >
      <TabsList variant="line" aria-label="Evolutionary scenario">
        <TabsTrigger value="helium">A · Helium</TabsTrigger>
        <TabsTrigger value="carbon">B · Carbon</TabsTrigger>
      </TabsList>
      <TabsContent value={active} className="scenario-panel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className="scenario-panel-inner"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            <span className="evidence-tag model">Model-dependent</span>
            <p className="scenario-label">{scenario.label}</p>
            <h3>{scenario.title}</h3>
            <p className="period-assumption">{scenario.periods}</p>
            <strong>{scenario.conclusion}</strong>
            <a href={scenario.href}>{scenario.source}</a>
          </motion.div>
        </AnimatePresence>
      </TabsContent>
      <p className="scenario-warning">
        Changing the pulsation-mode assignment changes the inferred evolutionary
        stage. Neither panel is a direct measurement of the core.
      </p>
    </Tabs>
  );
}
