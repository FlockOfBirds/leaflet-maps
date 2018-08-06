class HomePage {
    public open(): void {
        browser.url("/");
    }
}

const defaultPage = new HomePage();

export default defaultPage;
