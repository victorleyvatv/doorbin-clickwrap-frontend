import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowLeft, Loader2, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContractData {
  client: string;
  property: string;
  units: string;
  rate: string;
  summary: string;
}

const App: React.FC = () => {
  const [page, setPage] = useState<1 | 2>(1);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractData>({
    client: 'Loading...',
    property: 'Loading...',
    units: '...',
    rate: '...',
    summary: '...',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setRecordId(id);
      fetchData(id);
    } else {
      setLoading(false);
      setError("No record ID found in URL.");
    }
  }, []);

  const fetchData = async (id: string) => {
    try {
      const res = await fetch(`https://n8n.doorbinwaste.com/webhook/consultar-cotizacion?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch contract data");
      const data = await res.json();
      
      setContractData({
        client: data.nombre_cliente || '[Client Pending]',
        property: data.propiedad || '[Property Pending]',
        units: data.unidades || '0',
        rate: data.precio_mensual || '$0.00',
        summary: data.detalle_servicio || 'Service details as specified.',
      });
    } catch (e) {
      console.error("Data Fetch Error", e);
      setError("Could not load contract details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !authorized || !recordId) return;

    setSubmitting(true);
    try {
      // Use URLSearchParams to send data as application/x-www-form-urlencoded
      // to match the original form submission behavior
      const formData = new URLSearchParams();
      formData.append('airtable_record_id', recordId);
      formData.append('accepted_at', new Date().toISOString());
      formData.append('status', 'accepted');

      const response = await fetch('https://n8n.doorbinwaste.com/webhook/consultar-cotizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Submission failed");
      }
    } catch (e) {
      console.error("Submission Error", e);
      alert("There was an error submitting your acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#1a1a1a] p-10 rounded-3xl border border-gray-800 text-center shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#ADFF2F]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#ADFF2F]" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Agreement Accepted</h2>
          <p className="text-gray-400 text-lg mb-8">
            Thank you for choosing to work with us! Your service acceptance has been recorded successfully. We look forward to a successful partnership.
          </p>
          <div className="text-sm text-gray-500 uppercase tracking-widest">
            Doorbin Waste Services LLC
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence mode="wait">
        {page === 1 ? (
          <motion.div
            key="page-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <header className="flex flex-col items-center text-center">
              <img src="https://i.ibb.co/7NyScgsQ/doorbin-icon-new.png" alt="Logo" className="w-24 mb-6" />
              <h1 className="text-4xl font-bold tracking-tight mb-2">Service Acceptance Protocol</h1>
              <p className="text-gray-400 text-lg">Doorbin Waste Professional Management Agreement</p>
            </header>

            <div className="bg-[#1a1a1a] p-10 rounded-3xl border border-gray-800 leading-relaxed text-gray-300 text-lg space-y-6 shadow-2xl">
              <p>
                This Professional Service Agreement governs the door-to-door waste collection and management services provided by <b>Doorbin Waste LLC</b>. Our specialized Valet Trash solution is meticulously designed to enhance multi-family residential properties and condominiums through reliable, sustainable, and professional waste removal protocols.
              </p>
              <p>
                By proceeding, you acknowledge that our team possesses the technical capacity, industry experience, and necessary resources to manage on-site waste safely and efficiently. This agreement outlines the mutual obligations, service schedules, and performance standards required to maintain optimal environmental conditions for your residents.
              </p>
              <p>
                Please review the specific details regarding property units, frequency, and pricing in the full{' '}
                <button 
                  onClick={() => setPage(2)}
                  className="text-[#ADFF2F] font-bold hover:underline focus:outline-none"
                >
                  Terms of Service
                </button>{' '}
                before final submission.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-5 border-t border-gray-800 pt-10 text-base">
                <label className="flex items-start space-x-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-gray-700 bg-gray-800 transition-all checked:bg-[#2E8B57] checked:border-[#2E8B57]"
                      required
                    />
                    <Check className="absolute left-1 top-1 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    I have read and agree to the Doorbin Waste Master Service Agreement.
                  </span>
                </label>

                <label className="flex items-start space-x-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={authorized}
                      onChange={(e) => setAuthorized(e.target.checked)}
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-gray-700 bg-gray-800 transition-all checked:bg-[#2E8B57] checked:border-[#2E8B57]"
                      required
                    />
                    <Check className="absolute left-1 top-1 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    I confirm that I have authority to bind the client to these terms.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms || !authorized || submitting || loading}
                className={cn(
                  "w-full py-5 rounded-2xl text-xl font-bold transition-all uppercase tracking-wider flex items-center justify-center space-x-3",
                  acceptedTerms && authorized && !submitting && !loading
                    ? "bg-[#ADFF2F] text-black hover:brightness-110 shadow-lg"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Accept & Continue</span>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="page-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <header className="flex justify-between items-center pb-4 border-b border-gray-800">
              <div className="flex items-center space-x-4">
                <img src="https://i.ibb.co/7NyScgsQ/doorbin-icon-new.png" className="w-10" alt="Logo" />
                <h2 className="text-2xl font-bold tracking-tight">Master Service Agreement</h2>
              </div>
              <button 
                onClick={() => setPage(1)}
                className="text-[#ADFF2F] text-sm font-bold hover:underline flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> BACK TO OVERVIEW
              </button>
            </header>

            <div className="bg-[#1a1a1a] text-gray-300 p-10 rounded-2xl border border-gray-800 h-[65vh] overflow-y-auto custom-scrollbar legal-text leading-7 text-[15px] shadow-inner">
              <div className="space-y-8 text-justify">
                <h2 className="text-center font-bold text-xl text-white uppercase tracking-widest border-b border-gray-800 pb-6 mb-10">
                  MASTER SERVICE AGREEMENT FOR DOOR-TO-DOOR WASTE COLLECTION
                </h2>
                
                <p><b>PARTIES:</b> This Agreement is entered into by and between <b>DOORBIN WASTE LLC</b>, a Florida Limited Liability Company, hereinafter referred to as the <b>"SERVICE PROVIDER"</b>, and <b>{contractData.client}</b>, hereinafter referred to as the <b>"CLIENT"</b>, collectively known as the "Parties".</p>
                
                <p><b>PROPERTY IDENTIFICATION:</b> The services outlined herein shall be exclusively rendered at the residential property located at <b>{contractData.property}</b>, hereinafter referred to as the "Property".</p>

                <h3>I. DECLARATIONS</h3>
                <p><b>1.1 Capacity:</b> The SERVICE PROVIDER declares it possesses the specialized technical knowledge, licensed equipment, and professional personnel required to execute door-to-door waste management (Valet Trash) in compliance with local health and safety standards.</p>
                <p><b>1.2 Authority:</b> The CLIENT declares that it has the full legal authority to represent the Property and to enter into this binding agreement for the management of waste services on behalf of its residents.</p>

                <h3>II. SCOPE OF SERVICES</h3>
                <p><b>2.1 Operations:</b> The SERVICE PROVIDER shall provide comprehensive door-to-door waste collection for <b>{contractData.units} residential units</b>. The specific operational frequency and additional conditions are established as follows: <i>{contractData.summary}</i>.</p>
                <p><b>2.2 Digital Oversight:</b> SERVICE PROVIDER will utilize its proprietary Service App to provide the CLIENT with automated activity logs and digital photographic evidence of service completion.</p>

                <h3>III. TERM AND DURATION</h3>
                <p><b>3.1 Initial Term:</b> This Agreement shall commence on the date of electronic acceptance and remain in full force for an initial period of twelve (12) months. This contract will automatically renew for successive twelve-month periods unless written notice of non-renewal is provided at least thirty (30) days prior to the expiration date.</p>

                <h3>IV. FINANCIAL TERMS</h3>
                <p><b>4.1 Monthly Rate:</b> The CLIENT agrees to pay a fixed monthly service fee of <b>{contractData.rate}</b>. Invoices will be generated on the first (1st) day of each month for the current month's service.</p>
                <p><b>4.2 Payments:</b> All payments are due within fifteen (15) calendar days from the invoice date. Late payments may be subject to a monthly interest penalty of <b>5.0%</b> on the outstanding balance.</p>

                <h3>V. INDEMNIFICATION AND LIABILITY</h3>
                <p><b>5.1 Insurance:</b> The SERVICE PROVIDER maintains comprehensive general liability insurance, vehicle insurance, and workers' compensation as required by the State of Florida. The SERVICE PROVIDER shall not be held liable for damages resulting from preexisting Property conditions or third-party negligence.</p>

                <h3>VI. CONFIDENTIALITY AND GOVERNING LAW</h3>
                <p><b>6.1 Data Protection:</b> Both parties agree to maintain the strict confidentiality of all resident data and internal property protocols disclosed during the term of this service.</p>
                <p><b>6.2 Jurisdiction:</b> This Agreement shall be governed and construed in accordance with the laws of the State of Florida. Any legal dispute shall be settled exclusively in the competent courts located within the State of Florida.</p>

                <h3>VII. TERMINATION AND BREACH OF CONTRACT</h3>
                <p><b>7.1 Early Termination:</b> Termination of this Agreement by the CLIENT without cause prior to the expiration of the initial twelve (12) month term shall incur a mandatory early termination fee equal to <b>fifty percent (50%)</b> of the current monthly service rate, in addition to any outstanding balances due.</p>
                <p><b>7.2 Force Majeure:</b> Either party may terminate this Agreement without penalty upon written notice in the event of Force Majeure or circumstances beyond reasonable control that render the fulfillment of services impossible.</p>
                <p><b>7.3 Default and Suspension:</b> Proven violations of contractual obligations by either party, or repetitive failure by the CLIENT to meet financial obligations, may result in the immediate suspension of services and/or the permanent closure of the contract at the SERVICE PROVIDER’S sole discretion.</p>

                <div className="mt-16 pt-10 border-t border-gray-800 text-[12px] text-gray-500 italic text-center leading-relaxed">
                  <b>LEGAL NOTICE:</b> This digital document constitutes a Master Service Agreement executed via electronic acceptance. By clicking "ACCEPT & CONTINUE", the CLIENT certifies that they have read, understood, and voluntarily agreed to be bound by all terms, conditions, and operational standards set forth by Doorbin Waste LLC.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-center text-gray-600 text-xs tracking-widest uppercase">
        © {new Date().getFullYear()} Doorbin Waste Services LLC. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
