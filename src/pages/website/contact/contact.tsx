import { useState } from 'react';
import './contact.css';
import PageBg from '../../../components/pageBg/PageBg';
import PageBanner from '../../../components/pageBanner/PageBanner';
import { BANNER_IMAGES } from '../../../components/pageBanner/bannerImages';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <PageBg className="contact-page">
      <PageBanner title="Contact Us" backgroundImage={BANNER_IMAGES.contact} />
      <div className="contact-container container">
        <div className="contact-grid">
          
          {/* Left Column: Form */}
          <div className="contact-form-section">
            <h1 className="contact-title">Get In Touch</h1>
            <p className="contact-description">
              Have questions or feedback? We'd love to hear from you. Fill out the form below and our team will get back to you as soon as possible.
            </p>

            {isSent ? (
              <div className="contact-success-message">
                <i className="fa-solid fa-circle-check"></i>
                <h3>Thank You!</h3>
                <p>Your message has been sent successfully. We will get back to you shortly.</p>
                <button className="contact-reset-btn" onClick={() => setIsSent(false)}>Send Another Message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your Name..."
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="The..."
                    value={form.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Type here..."
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Now'}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Info Cards */}
          <div className="contact-info-section">
            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="fa-solid fa-phone"></i>
              </div>
              <div className="contact-info-content">
                <h3>Phone Number</h3>
                <p><a href="tel:+18174640033">+1-817-464-0033</a></p>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div className="contact-info-content">
                <h3>Our Location</h3>
                <p>6000 Cleveland Gibbs Rd, Suite 300, Northlake, Texas 76226</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageBg>
  );
}
