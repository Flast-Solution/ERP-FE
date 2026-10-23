import { decodeBase64Param, resolvePreview } from './SitePreviewRuntime';

jest.mock('./WebPageRuntime', () => ({ RemoteLandingPage: () => null }));

const encode = (text) => window.btoa(text);

describe('SitePreviewRuntime', () => {
  it('giải base64 chuẩn và base64url', () => {
    expect(decodeBase64Param(encode('abc.vn'))).toBe('abc.vn');
    expect(decodeBase64Param(encode('https://ai.flast.vn/a?b=1').replace(/\+/g, '-').replace(/=+$/, ''))).toBe(
      'https://ai.flast.vn/a?b=1',
    );
  });

  it('chấp nhận remoteEntry trên host được phép', () => {
    const result = resolvePreview(
      encode('ABC.vn'),
      encode('https://ai.flast.vn/site_abc/remoteEntry.js'),
      ['ai.flast.vn'],
    );
    expect(result).toEqual({ domain: 'abc.vn', remote: 'https://ai.flast.vn/site_abc/remoteEntry.js' });
  });

  it('chặn host lạ, http và URL không phải remoteEntry', () => {
    const hosts = ['ai.flast.vn'];
    expect(resolvePreview(encode('abc.vn'), encode('https://evil.vn/x/remoteEntry.js'), hosts).error).toMatch(
      /chưa được phép/,
    );
    expect(resolvePreview(encode('abc.vn'), encode('http://ai.flast.vn/x/remoteEntry.js'), hosts).error).toMatch(
      /https/,
    );
    expect(resolvePreview(encode('abc.vn'), encode('https://ai.flast.vn/x/app.js'), hosts).error).toMatch(
      /remoteEntry/,
    );
    expect(resolvePreview('%%%', encode('x'), hosts).error).toBeTruthy();
  });
});
