
# 2024-04

## Moving to api.r-pkg.org

Let's try to deploy from a Dockerfile.

```
dokku apps:create ig
```

Then locally
```
git remote add dokku dokku@api.r-pkg.org:ig
git push dokku main
```

Add the letsencrypt plugin so we can have https.
```
dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
```

Try letsencrypt for the ig.api subdomain. The app has to load
properly for this, I am not sure why.
```
dokku letsencrypt:set ig email csardi.gabor@gmail.com
dokku letsencrypt:enable ig
```

Auto-update:
```
dokku letsencrypt:cron-job --add
```

If this works, then copy the certs from the old server. If the old server
is dokku, it might use an old letsencrypt plugin and the certs are here:
```
root@install-github:~# ls -l /home/dokku/ig/tls/
total 12
-rw------- 1 dokku dokku 3328 Apr  6 00:00 server.crt
-rw-r----- 1 dokku dokku  227 Apr  6 00:00 server.key
-rw------- 1 dokku dokku 3328 Apr  6 00:00 server.letsencrypt.crt
```

In the new letsencrypt plugin the certificates are here:
```
root@api:~# ls -l /home/dokku/ig/letsencrypt/certs/current/certificates/
total 20
-rw------- 1 dokku dokku 3320 Apr 12 10:22 ig.api.r-pkg.org.crt
-rw------- 1 dokku dokku 1827 Apr 12 10:22 ig.api.r-pkg.org.issuer.crt
-rw------- 1 dokku dokku  237 Apr 12 10:22 ig.api.r-pkg.org.json
-rw------- 1 dokku dokku  227 Apr 12 10:22 ig.api.r-pkg.org.key
-rw------- 1 dokku dokku 3547 Apr 12 10:22 ig.api.r-pkg.org.pem
```

Seemingly we cannot easily inject the old certs into the new letsencrypt
plugin, but we can add them using `dokku certs`. `fullchain.pem` will be
`server.crt` and `privkey.pem` will be `server.key`.

```
tar cf cert.tar server.{key,crt}
dokku domains:add ig install-github.me
cat cert.tar | dokku certs:add ig
```

Now check that the new cert is working. For this edit the /etc/hosts file
on your computer and point install-github.me to the new IP.
Then try
```
curl -v https://install-github.me
```

If this works fine, then you are ready to change the DNS to point to the
new IP. It might take a while until the DNS updates, check with `dig`
locally.

Once the DNS updated, run letsencrypt again, to get a cert for both
domains:
```
dokku letsencrypt:enable ig
```

At this point (well, a little time later, to give time for the DNS to
update everywhere), you can turn off the old server.
