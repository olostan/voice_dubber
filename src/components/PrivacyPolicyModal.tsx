import React, { useState } from 'react';
import { Shield, Lock, Trash2, Sparkles, Scale, AlertCircle, X, Check, HeartHandshake, Eye } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'ai' | 'copyright';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'ai' | 'copyright'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans']">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#121216] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black font-black shadow-lg shadow-orange-950/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-['Outfit'] text-white">
                Privacy, Terms & Trust Center
              </h2>
              <p className="text-xs text-zinc-400">
                Transparent, Fair & Respectful — Your privacy & creator rights matter
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950/80 border-b border-zinc-800/60 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-orange-500 text-black shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-orange-500 text-black shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-orange-500 text-black shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI & Speech Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('copyright')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'copyright'
                ? 'bg-orange-500 text-black shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Copyright & Fair Use</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 text-sm text-zinc-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-white text-sm">Our Core Privacy Commitment</h4>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    We only collect minimal data necessary for voice dubbing. We <strong>never sell, rent, or monetize</strong> your personal information or recordings. You have full ownership and can delete your data at any time.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  1. Information We Collect
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                  <li><strong>Account Data (Optional):</strong> When you sign in with Google, we receive your public name, email address, and profile photo provided by Google OAuth.</li>
                  <li><strong>Dubbing Projects:</strong> Dialogue scripts, timestamps, character profiles, and audio effect settings you save to the cloud.</li>
                  <li><strong>Client-Side Storage:</strong> Video files and vocal takes are cached in your browser's private IndexedDB storage to provide instant playback without transferring video to our servers.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-400" />
                  2. What We Do NOT Collect or Do
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                  <li>We do <strong>not</strong> collect phone numbers, government IDs, physical addresses, or financial data.</li>
                  <li>We do <strong>not</strong> sell or trade your data to third-party ad networks or brokers.</li>
                  <li>We do <strong>not</strong> track your browsing activity across other websites.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-orange-400" />
                  3. Your Rights & Data Deletion
                </h3>
                <p>
                  You have the right to inspect and delete any cloud projects you create. In your <strong>My Dubs</strong> dashboard, clicking the trash icon immediately deletes project documents from Cloud Firestore. To clear local browser video and take caches, you can reset your session or clear browser storage.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  4. Children's Privacy (COPPA & GDPR-K Compliance)
                </h3>
                <p>
                  Fun Voice Dubber is built for general audiences. We do not knowingly collect or solicit personal information from children under the age of 13 (or under 16 in the European Union). If you believe a minor has provided us with personal information without parental consent, please contact us and we will delete it promptly.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">1. Acceptance of Terms</h3>
                <p>
                  By using Fun Voice Dubber (the "Service"), you agree to these Terms of Service. If you do not agree, please do not use the application.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">2. Acceptable Use Policy</h3>
                <p>Fun Voice Dubber is a comedic, creative, and educational tool. You agree not to use the service to:</p>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                  <li>Produce defamatory, hateful, abusive, or non-consensual deepfake audio impersonating real individuals maliciously.</li>
                  <li>Harass, threaten, or violate the privacy rights of others.</li>
                  <li>Circumvent technological security measures or abuse API rate limits.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">3. Parody & Fair Use Service</h3>
                <p>
                  The Service provides real-time browser-based dubbing and vocal effect tools. Dubs created on the platform are meant for personal entertainment, parody, and satire. The Service does not provide direct file downloading of external third-party copyrighted video assets.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">4. Limitation of Liability</h3>
                <p>
                  The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. To the fullest extent permitted by law, Fun Voice Dubber and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Google Gemini AI Integration Policy
                </h4>
                <p className="text-xs text-amber-300/90 mt-1">
                  We leverage official Google Gemini APIs for speech recognition, diarization, and comedic script suggestions under strict enterprise data safety standards.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">1. How AI is Used</h3>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                  <li><strong>Audio Diarization:</strong> Converts short recorded audio clips into speaker-delineated text timestamps so you can immediately dub lines.</li>
                  <li><strong>Script Suggestions:</strong> Generates comedic character dialogue and parody prompts.</li>
                  <li><strong>AI Comedy Judge:</strong> Evaluates comedic timing and rhythm to award badges and scores.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">2. AI Data Protection & Retention</h3>
                <p>
                  Audio snippets submitted for transcription are processed ephemerally by Google Gemini API endpoints. User audio is <strong>not used to train public AI models</strong>. We adhere to Google Cloud's AI Ethics & Security principles.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'copyright' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/40 text-blue-200">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" />
                  Respect for Creators & Intellectual Property
                </h4>
                <p className="text-xs text-blue-300/90 mt-1">
                  Fun Voice Dubber is built with deep respect for content creators and copyright owners. We operate as a real-time transformative parody platform.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">1. Transformative Parody & 45-Second Limit</h3>
                <p>
                  To encourage original satire and creative comedy while preventing misuse, tab recordings are strictly limited to a maximum of <strong>45 seconds</strong>. The service does not host full-length copyrighted media or provide video ripping/download tools.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white">2. DMCA & Copyright Takedowns</h3>
                <p>
                  If you are a copyright owner or an agent thereof and believe that any script, project, or content on the platform infringes upon your copyright, please contact us with:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                  <li>Identification of the copyrighted work claimed to have been infringed.</li>
                  <li>Identification of the project link/ID to be removed.</li>
                  <li>Your contact information (name, address, telephone number, email).</li>
                  <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
                </ul>
                <p className="mt-2 text-xs text-zinc-400">
                  Takedown requests can be sent to <strong>dmca@fun-voice-dubber.com</strong> and will be processed promptly.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
          <p>Last Updated: September 2026</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold cursor-pointer transition-colors shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
