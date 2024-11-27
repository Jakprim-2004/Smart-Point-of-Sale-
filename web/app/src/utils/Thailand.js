import axios from 'axios';

const THAILAND_API = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json';

export const fetchThailandData = async () => {
    try {
        const response = await axios.get(THAILAND_API);
        return response.data;
    } catch (error) {
        console.error('Error fetching Thailand data:', error);
        return [];
    }
};

export const getDistricts = (provinceData, selectedProvince) => {
    const province = provinceData.find(p => p.name_th === selectedProvince);
    return province ? province.amphure : [];
};

export const getSubDistricts = (provinceData, selectedProvince, selectedDistrict) => {
    const province = provinceData.find(p => p.name_th === selectedProvince);
    const district = province?.amphure.find(d => d.name_th === selectedDistrict);
    return district ? district.tambon : [];
};

export const getPostalCode = (provinceData, selectedProvince, selectedDistrict, selectedSubDistrict) => {
    const province = provinceData.find(p => p.name_th === selectedProvince);
    const district = province?.amphure.find(d => d.name_th === selectedDistrict);
    const subDistrict = district?.tambon.find(sd => sd.name_th === selectedSubDistrict);
    return subDistrict?.zip_code || '';
};
