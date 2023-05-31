import axios from "axios";

export const getLocationGoogleApi = async (location: string) => {
  const { data } = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      location
    )}&key=${process.env.GOOGLE_API_KEY}`
  );
  return data.results[0].geometry.location;
};
