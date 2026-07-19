# Authentication Postman Tests

Use these scripts in the Postman `Tests` tab.

## Register / Login Success

```js
pm.test("returns success response shape", function () {
  const json = pm.response.json();
  pm.expect(json.success).to.eql(true);
  pm.expect(json.message).to.be.a("string");
  pm.expect(json.data).to.be.an("object");
  pm.expect(json.errors).to.eql(null);
});

pm.test("sets auth cookies", function () {
  pm.expect(pm.cookies.has("accessToken")).to.eql(true);
  pm.expect(pm.cookies.has("refreshToken")).to.eql(true);
});

pm.test("returns user", function () {
  const user = pm.response.json().data.user;
  pm.expect(user).to.have.property("id");
  pm.expect(user).to.have.property("email");
  pm.expect(user).to.have.property("role");
  pm.expect(user).to.not.have.property("password");
});
```

## Validation Error

```js
pm.test("returns validation error shape", function () {
  const json = pm.response.json();
  pm.expect(pm.response.code).to.eql(400);
  pm.expect(json.success).to.eql(false);
  pm.expect(json.data).to.eql(null);
  pm.expect(json.errors).to.be.an("array");
});
```

## Duplicate Email

```js
pm.test("rejects duplicate email", function () {
  const json = pm.response.json();
  pm.expect(pm.response.code).to.eql(409);
  pm.expect(json.success).to.eql(false);
  pm.expect(json.message).to.include("Email already registered");
});
```

## Me

```js
pm.test("returns current user", function () {
  const json = pm.response.json();
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(json.success).to.eql(true);
  pm.expect(json.data.user).to.have.property("id");
});
```

## Logout

```js
pm.test("logs out", function () {
  const json = pm.response.json();
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(json.success).to.eql(true);
  pm.expect(json.message).to.eql("Logout successful");
});
```

