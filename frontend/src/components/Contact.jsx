import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Briefcase } from "lucide-react";

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const ContactCard = ({ icon: Icon, title, content, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05)" }}
    className="p-8 rounded-3xl bg-slate-50 border border-gray-200/60 shadow-sm transition-all duration-355 flex flex-col items-start gap-4"
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
      <Icon size={22} />
    </div>
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      {content && <p className="text-slate-550 font-semibold text-sm leading-relaxed">{content}</p>}
      {children}
    </div>
  </motion.div>
);

const Contact = () => {
  const position = [18.5967088, 73.7354267];

  return (
    <section
      id="contact"
      className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-24 relative"
    >
      <div className="max-w-6xl w-full relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs uppercase tracking-widest font-black text-primary">Get In Touch</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Reach Us <span className="text-primary">Anytime</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium">We're here to help you innovate and grow.</p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Column 1: Mail and Phone */}
          <div className="flex flex-col gap-6">
            <ContactCard
              icon={Mail}
              title="Email Us"
              content="qirotechinnovation@gmail.com"
              delay={0.1}
            />

            <ContactCard
              icon={Phone}
              title="Call Us"
              content="+91 86238 23997"
              delay={0.2}
            />
          </div>

          {/* Column 2: Leaflet Map Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="h-[400px] lg:h-auto min-h-[350px]"
          >
            <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative z-0">
              <MapContainer
                center={position}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} icon={markerIcon}>
                  <Popup>QiroTech Innovation Office</Popup>
                </Marker>
              </MapContainer>
            </div>
          </motion.div>

          {/* Column 3: Business and Location */}
          <div className="flex flex-col gap-6">
            <ContactCard
              icon={Briefcase}
              title="Business"
              delay={0.3}
            >
              <div className="space-y-1 text-slate-550 font-semibold text-sm">
                <p>+91 86004 86482</p>
                <p>+91 98605 07744</p>
              </div>
            </ContactCard>

            <ContactCard
              icon={MapPin}
              title="Location"
              content="Office No. 602, 6th Floor, The Business Advantedge, Marunji Road, Pune 411057"
              delay={0.4}
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
