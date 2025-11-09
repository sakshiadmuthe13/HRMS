// src/components/Contact.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const Contact = () => {
  const position = [18.452093, 73.828288];

  return (
    <section
      id="contact"
      className="min-h-screen bg-dark3 text-textLight flex flex-col items-center justify-center px-6 py-20"
    >
      {/* Heading */}
      <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-primary text-center">
        Reach Us <span className="text-white">Anytime</span>
      </h2>

      {/* Main container */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl gap-12">
        {/* Left: Contact Info */}
        <div className="flex-1 flex flex-col gap-6 text-gray-300 p-6 rounded-xl shadow-md card-glow">
          <div>
            <h3 className="text-3xl font-bold mb-2 text-white">Mail ID</h3>
            <p className="text-lg text-gray-300">info@dwi4u.com</p>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-2 text-white">Phone</h3>
            <p className="text-lg text-gray-300">+91 92841 17439</p>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-2 text-white">
              Business Enquiry
            </h3>
            <p className="text-lg text-gray-300">
              +91 86690 86844, +91 95955 05063
            </p>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-2 text-white">Location</h3>
            <p className="text-lg text-gray-300">
              Office No. 13, 3rd Floor, Shreya Business Hub, Pari Chowk, Near
              CNG Gas Station, Narhe, Pune. Maharashtra - 411041
            </p>
          </div>
        </div>

        {/* Right: Leaflet Map */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-lg card-glow min-h-[350px] md:min-h-[450px] border border-dark2">
          <MapContainer
            center={position}
            zoom={16}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position} icon={markerIcon}>
              <Popup>DW Innovation Office</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
};

export default Contact;
