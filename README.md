---

### Step-by-Step Guide for Authentication and Token Management

#### **1. Retrieve CSRF Token**
Before making any authenticated requests, obtain a CSRF token:

- **Request:**
  - **Method:** `GET`
  - **Endpoint:** `</api/csrf-token>`

- **Response:**
  - A CSRF token is returned, which must be used in subsequent requests.

#### **2. Signup or Login**
For signup or login, include the CSRF token obtained in Step 1 in the request headers:

- **Request:**
  - **Method:** `POST`
  - **Endpoint:** `</api/auth/signup>` or `</api/auth/login>`
  - **Headers:**
    - **`CSRF-Token:`** `12dSk0Zz-fq_QIEC481uzTbzxtM8QEjlYVF4`
  - **Body:**
    - Include user credentials (e.g., email, password).

- **Response:**
  - The server responds with:
    - **`accessToken`**: Used to authenticate subsequent requests.
    - **`refreshToken`** (for mobile devices): Used to obtain a new `accessToken` when it expires.
  - **Storage**:
    - Tokens are saved in cookies. For mobile devices, the `refreshToken` is also returned in the response body.

#### **3. Refresh Access Token Before Every Request**
Before making any request to a protected endpoint, you **must** first refresh the `accessToken` to ensure it is valid:

- **Request:**
  - **Method:** `POST`
  - **Endpoint:** `</api/refresh>`
  - **Headers:**
    - **`Authorization:`** `Bearer <refreshToken>`
    - **`CSRF-Token:`** `12dSk0Zz-fq_QIEC481uzTbzxtM8QEjlYVF4`

- **Response:**
  - The server provides a new `accessToken`. For mobile devices, both `accessToken` and `refreshToken` may be returned.

#### **4. Use Tokens in Protected Requests**
After obtaining a fresh `accessToken`, include it in the headers of your request to the protected endpoint:

- **Request:**
  - **Method:** Varies (e.g., `GET`, `POST`, etc.)
  - **Endpoint:** Any protected endpoint, e.g., `</api/protected>`
  - **Headers:**
    - **`Authorization:`** `Bearer <accessToken>`
    - **`CSRF-Token:`** `12dSk0Zz-fq_QIEC481uzTbzxtM8QEjlYVF4`

#### **5. Mobile-Specific Requirements**
For mobile devices, include both `accessToken` and `refreshToken` with each request:

- **Request for Mobile Devices:**
  - **Method:** Varies (e.g., `GET`, `POST`, etc.)
  - **Endpoint:** Any protected endpoint, e.g., `</api/protected>`
  - **Headers:**
    - **`Authorization:`** `Bearer <accessToken>`
    - **`CSRF-Token:`** `12dSk0Zz-fq_QIEC481uzTbzxtM8QEjlYVF4`
    - **`Refresh-Token:`** `<refreshToken>` (if required)

---

**Important Note:**  
**Every request to a protected endpoint must be preceded by a request to `/api/refresh` to ensure the `accessToken` is up-to-date and valid.** This step is crucial for maintaining secure access to the system and preventing unauthorized requests.

---

**How to run prisma** 
Docker-compose exec expressjs npx prisma db push
Docker-compose exec expressjs npx prisma studio