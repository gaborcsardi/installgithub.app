
uurls = {
  'gh_pkg_description':
  'https://raw.githubusercontent.com/${user}/${repo}/master/DESCRIPTION',
  'gh_pkg_contents':
  'https://api.github.com/repos/${user}/${repo}/contents',
  'gh_tar_gz':
  'https://github.com/${user}/${repo}/archive/master.tar.gz'
};

function rep(url, user, repo) {
  return url
    .replace("${user}", user)
    .replace("${repo}", repo);
}

urls = {};

urls.gh_pkg_description = function(user, repo) {
  return rep(uurls.gh_pkg_description, user, repo);
}

urls.gh_pkg_contents = function(user, repo) {
  return rep(uurls.gh_pkg_contents, user, repo);
}

urls.gh_tar_gz = function(user, repo) {
  return rep(uurls.gh_tar_gz, user, repo);
}

module.exports = urls;
