'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { PropertyForm } from '@/components/forms/PropertyForm';
import { ContractorForm } from '@/components/forms/ContractorForm';
import { JobForm } from '@/components/forms/JobForm';
import type { Contractor, Property } from '@/lib/db.types';

/**
 * Listens to palette-fired events (`rehabops:new-*`) and opens the matching
 * dialog anywhere in the app. Lives in the dashboard layout.
 */
export function GlobalDialogs({
  properties,
  contractors,
}: {
  properties: Pick<Property, 'id' | 'address'>[];
  contractors: Pick<Contractor, 'id' | 'company_name' | 'trade'>[];
}) {
  const [openProp, setOpenProp] = useState(false);
  const [openCont, setOpenCont] = useState(false);
  const [openJob, setOpenJob] = useState(false);

  useEffect(() => {
    const onProp = () => setOpenProp(true);
    const onCont = () => setOpenCont(true);
    const onJob = () => setOpenJob(true);
    window.addEventListener('rehabops:new-property', onProp);
    window.addEventListener('rehabops:new-contractor', onCont);
    window.addEventListener('rehabops:new-job', onJob);
    return () => {
      window.removeEventListener('rehabops:new-property', onProp);
      window.removeEventListener('rehabops:new-contractor', onCont);
      window.removeEventListener('rehabops:new-job', onJob);
    };
  }, []);

  return (
    <>
      <Dialog
        open={openProp}
        onOpenChange={setOpenProp}
        size="lg"
        title="New property"
        description="Add a property to the operating portfolio."
      >
        <PropertyForm onSuccess={() => setOpenProp(false)} />
      </Dialog>
      <Dialog
        open={openCont}
        onOpenChange={setOpenCont}
        size="lg"
        title="Add contractor"
        description="Bring a new trade onto the bench."
      >
        <ContractorForm onSuccess={() => setOpenCont(false)} />
      </Dialog>
      <Dialog
        open={openJob}
        onOpenChange={setOpenJob}
        size="lg"
        title="New job"
        description="Spec the work or kick it off as a bid request."
      >
        <JobForm
          properties={properties}
          contractors={contractors}
          onSuccess={() => setOpenJob(false)}
        />
      </Dialog>
    </>
  );
}
