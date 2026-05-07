import React from 'react';
import { motion } from 'framer-motion';
import './Services.css';

import service1 from '../../../assets/service1.png';
import service2 from '../../../assets/service2.png';
import service3 from '../../../assets/service3.png';
import service4 from '../../../assets/service4.png';
import trainImg from '../../../assets/train.png';
import styleImg from '../../../assets/style.png';

const SERVICE_CARDS = [
  { title: 'DINE IN',        image: service1, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'HOME DELIVERY',  image: service2, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'FRESHLY SERVED', image: service3, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
  { title: 'EVENT HOSTING',  image: service4, desc: 'Expert chefs preparing authentic and flavorful dishes.' },
];

const ServicesPage = () => {
  return (
    <div className="services-page">
      <section className="hj-services">
        <motion.div
          className="hj-section-title-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hj-ribbon" style={{ backgroundImage: `url(${styleImg})` }}>SERVICES</div>
          <img src={trainImg} alt="" aria-hidden="true" className="hj-ribbon-train" />
        </motion.div>

        <div className="hj-services-grid">
          {SERVICE_CARDS.map((service, i) => (
            <motion.article
              className="hj-service-card"
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <img src={service.image} alt={service.title} className="hj-service-icon" />
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
