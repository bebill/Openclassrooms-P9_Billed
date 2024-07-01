/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
jest.mock("../app/Store", () => mockStore)

window.alert = jest.fn()

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const html = NewBillUI()
      document.body.innerHTML = html
    })
    test("Then the form should be displayed", () => {
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })
    describe("When I click on load file and upload a file", () => {
      test("Then I shouldn't be able to upload a file with the wrong format", async () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const file = new File(['facturefreemobile.pdf'], 'facturefreemobile.pdf', { type: 'application/pdf' })
        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", handleChangeFile)
        fireEvent.change(fileInput, { target: { files: [file] } })
        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled())
        expect(window.alert).toHaveBeenCalledWith("Le format du fichier n'est pas valide. Veuillez sélectionner un fichier au format JPG, JPEG ou PNG.")
        expect(Object.keys(fileInput.files[0]).length).toBe(0); // file is not uploaded
      })
      test("Then uploaded file should be with the right format", () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const file = new File(['facturefreemobile.jpg'], 'facturefreemobile.jpg', { type: 'image/jpg' })
        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", handleChangeFile)
        fireEvent.change(fileInput, { target: { files: [file] } })
        expect(handleChangeFile).toHaveBeenCalled()
        expect(fileInput.files[0].name).toBe(file.name)
      })
    })

    describe("When the form is submitted", () => {
      test("Then should not submit the form if the file is not uploaded", () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleSubmit = jest.fn(newBill.handleSubmit)
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith("Veuillez soumettre un fichier avant de continuer.")
      })
    })
  })
})
