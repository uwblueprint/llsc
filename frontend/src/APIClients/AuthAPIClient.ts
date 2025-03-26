import baseAPIClient from './BaseAPIClient'

const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: number, // later add signup methods + with credentials
) => {
    try {
        const { data } = await baseAPIClient.post(
            "/users/",
            { firstName, lastName, email, role, password },
          );
          return data;
        } catch (error) {
          return null;
        }      
    }

    export default register
