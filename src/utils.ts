

export const fetchReq = async (url, type: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, params?: any, serialize?: boolean, contentType?: string | boolean, accept?: string | boolean): Promise<any> => {
    const headers = {};
    if (contentType != null) {
        if (contentType != false)
            headers["Content-Type"] = contentType;
    } else {
        headers["Content-Type"] = "application/json";
    }
    if (accept != null) {
        if (accept != false)
            headers["Accept"] = accept;
    } else {
        headers["Accept"] = "application/json";
    }


    return fetch(`${url}/${params ? Object.keys(params).map((item) => item + '=' + params[item]).join("&") : ''}`, {
        method: type,
        headers: headers,
        body: body ? (serialize != false ? JSON.stringify(body) : body) : null
    })
        .then(async response => {
            if (!response.ok) {
                const err = await response.json();
                console.error(err);
                throw err;
            }
            return response.json() as Promise<any>
        })
        .then(data => {
            return data;
        });
}