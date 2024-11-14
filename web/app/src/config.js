const config = {
    api_path: 'http://localhost:3000',
    token_name: 'pos_token',
    headers: () => {
        const token = localStorage.getItem(config.token_name);
        if (!token) {
            
            console.error('No token found');
            return {};
        }
        
        return {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }
    }
}

export default config;
