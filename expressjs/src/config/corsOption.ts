const allowedOrigins = [
    "*"
]
export const corsOptions = {
    origin: allowedOrigins,
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204

}
