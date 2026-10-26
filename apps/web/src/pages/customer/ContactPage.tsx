import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const ContactPage: React.FC = () => {
  const { success } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success('Message sent to dispatch desk. We will get in touch shortly!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
          24x7 Operations Support
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Contact Our Fleet Dispatch Desk
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Have an urgent airport transfer, custom corporate itinerary, or need fleet assistance? We are available around the clock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-navy-950 text-white space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Fleet Operations Headquarters
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Office Address</span>
                  <p className="text-slate-400 leading-relaxed mt-0.5">
                    Plot 42, Aerocity Commercial Hub, Indira Gandhi International Airport Zone, New Delhi, 110037
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Dispatch Hotline</span>
                  <a href="tel:+919876543210" className="text-brand-400 hover:text-brand-300 block font-bold">
                    +91 98765 43210
                  </a>
                  <span className="text-[11px] text-slate-400">Available 24 hours / 365 days</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Official Email</span>
                  <a href="mailto:dispatch@eliteride.com" className="text-brand-400 hover:text-brand-300 block">
                    dispatch@eliteride.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Operating Schedule</span>
                  <p className="text-slate-400 leading-relaxed mt-0.5">
                    Highway dispatch and airport standby operating continuously 24/7.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <h3 className="text-base font-bold text-navy-900 mb-1">Send a Message</h3>
            <p className="text-xs text-slate-500 mb-6">
              Fill out this form and a fleet coordinator will call you back within 15 minutes.
            </p>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Message Received!</h4>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you, {name}. Our duty dispatcher has been notified and will call you on {phone} shortly.
                </p>
                <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ankit Sharma"
                  />
                  <Input
                    label="Mobile Phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9811122334"
                  />
                </div>

                <Input
                  label="Email Address (Optional)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ankit@example.com"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Inquiry or Travel Request *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us your itinerary, required dates, or vehicle preference..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="md" icon={<Send className="w-4 h-4" />}>
                    Send Message to Dispatch
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

