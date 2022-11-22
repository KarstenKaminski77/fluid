<?php

namespace App\Controller;

use App\Entity\Addresses;
use App\Entity\Baskets;
use App\Entity\ClinicCommunicationMethods;
use App\Entity\Clinics;
use App\Entity\ClinicUserPermissions;
use App\Entity\ClinicUsers;
use App\Entity\CommunicationMethods;
use App\Entity\Countries;
use App\Entity\Distributors;
use App\Entity\DistributorUsers;
use App\Entity\Lists;
use App\Entity\RestrictedDomains;
use App\Entity\Species;
use App\Entity\UserPermissions;
use App\Form\AddressesFormType;
use App\Form\ClinicCommunicationMethodsFormType;
use App\Form\ClinicFormType;
use App\Form\ClinicUsersFormType;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use phpDocumentor\Reflection\Types\This;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class ClinicsController extends AbstractController
{
    const ITEMS_PER_PAGE = 12;
    private $em;
    private $plainPassword;
    private $encryptor;

    public function __construct(EntityManagerInterface $em, Encryptor $encryptor) {

        $this->em = $em;
        $this->encryptor = $encryptor;
    }

    #[Route('/clinics/register', name: 'clinic_reg')]
    public function clinicReg(Request $request): Response
    {
        $clinics = new Clinics();
        $clinicUsers = new ClinicUsers();

        $clinics->getClinicUsers()->add($clinicUsers);

        $form = $this->createForm(ClinicFormType::class, $clinics)->createView();

        return $this->render('frontend/clinics/register.html.twig', [
            'form' => $form,
        ]);
    }

    protected function createClinicForm()
    {
        $clinics = new Clinics();

        return $this->createForm(ClinicFormType::class, $clinics);
    }

    public function createClinicsAddressesForm()
    {
        $methods = new Addresses();

        return $this->createForm(AddressesFormType::class, $methods);
    }

    public function createClinicCommunicationMethodsForm()
    {
        $communicationMethods = new ClinicCommunicationMethods();

        return $this->createForm(ClinicCommunicationMethodsFormType::class, $communicationMethods);
    }

    public function createClinicUserForm()
    {
        $clinicUsers = new ClinicUsers();

        return $this->createForm(ClinicUsersFormType::class, $clinicUsers);
    }

    #[Route('/clinics/register/create', name: 'clinic_create')]
    public function clinicsCreateAction(Request $request, UserPasswordHasherInterface $passwordHasher, MailerInterface $mailer): Response
    {
        $data = $request->request;
        $clinics = $this->em->getRepository(Clinics::class)->findOneBy(['hashedEmail' => md5($data->get('email'))]);

        if($clinics == null) {

            $clinics = new Clinics();

            $plainTextPwd = $this->generatePassword();
            $country = $this->em->getRepository(Countries::class)->findOneBy([
                'code' => $data->get('clinic-iso-code'),
            ]);

            if (!empty($plainTextPwd)) {

                $domainName = explode('@', $data->get('email'));

                $clinics->setClinicName($this->encryptor->encrypt($data->get('clinicName')));
                $clinics->setEmail($this->encryptor->encrypt($data->get('email')));
                $clinics->setHashedEmail(md5($data->get('email')));
                $clinics->setDomainName(md5($domainName[1]));
                $clinics->setTelephone($this->encryptor->encrypt($data->get('clinic-telephone')));
                $clinics->setIntlCode($this->encryptor->encrypt($data->get('clinic-intl-code')));
                $clinics->setIsoCode($this->encryptor->encrypt($data->get('clinic-iso-code')));
                $clinics->setCountry($country);

                $this->em->persist($clinics);
                $this->em->flush();

                // Create user
                $clinic = $this->em->getRepository(Clinics::class)->findOneBy([
                    'hashedEmail' => md5($data->get('email')),
                ]);
                $clinicUsers = new ClinicUsers();

                $hashedPwd = $passwordHasher->hashPassword($clinicUsers, $plainTextPwd);

                $clinicUsers->setClinic($clinic);
                $clinicUsers->setFirstName($this->encryptor->encrypt($data->get('firstName')));
                $clinicUsers->setLastName($this->encryptor->encrypt($data->get('lastName')));
                $clinicUsers->setPosition($this->encryptor->encrypt($data->get('position')));
                $clinicUsers->setEmail($this->encryptor->encrypt($data->get('email')));
                $clinicUsers->setHashedEmail(md5($data->get('email')));
                $clinicUsers->setTelephone($this->encryptor->encrypt($data->get('user-telephone')));
                $clinicUsers->setIntlCode($this->encryptor->encrypt($data->get('clinic-intl-code')));
                $clinicUsers->setIsoCode($this->encryptor->encrypt($data->get('clinic-iso-code')));
                $clinicUsers->setRoles(['ROLE_CLINIC']);
                $clinicUsers->setPassword($hashedPwd);
                $clinicUsers->setIsPrimary(1);

                $this->em->persist($clinicUsers);

                // Assign Full Permissions
                $userPermissions = $this->em->getRepository(UserPermissions::class)->findBy([
                    'isClinic' => 1,
                ]);

                foreach($userPermissions as $userPermission){

                    $clinicUserPermissions = new ClinicUserPermissions();

                    $clinicUserPermissions->setClinic($clinic);
                    $clinicUserPermissions->setUser($clinicUsers);
                    $clinicUserPermissions->setPermission($userPermission);

                    $this->em->persist($clinicUserPermissions);
                }

                // Create Default Basket
                $basket = new Baskets();

                $firstName = $this->encryptor->decrypt($clinicUsers->getFirstName());
                $lastName = $this->encryptor->decrypt($clinicUsers->getLastName());

                $basket->setClinic($clinic);
                $basket->setName('Fluid Commerce');
                $basket->setTotal(0);
                $basket->setStatus('active');
                $basket->setIsDefault(1);
                $basket->setSavedBy($this->encryptor->encrypt($firstName .' '. $lastName));

                $this->em->persist($basket);

                // Create In App Communication Method
                $clinicCommunicationMethod = new ClinicCommunicationMethods();
                $communicationMethod = $this->em->getRepository(CommunicationMethods::class)->find(1);

                $clinicCommunicationMethod->setClinic($clinic);
                $clinicCommunicationMethod->setCommunicationMethod($communicationMethod);
                $clinicCommunicationMethod->setSendTo($this->encryptor->encrypt($data->get('email')));
                $clinicCommunicationMethod->setIsDefault(1);
                $clinicCommunicationMethod->setIsActive(1);

                $this->em->persist($clinicCommunicationMethod);

                // Create Favourites List
                $favourite = new Lists();

                $favourite->setClinic($clinic);
                $favourite->setListType('favourite');
                $favourite->setName('Favourite Items');
                $favourite->setItemCount(0);
                $favourite->setIsProtected(1);

                $this->em->persist($favourite);
                $this->em->flush();

                // Send Email
                $body = '<table style="padding: 8px; border-collapse: collapse; border: none; font-family: arial">';
                $body .= '<tr><td colspan="2">Hi '. $this->encryptor->decrypt($clinicUsers->getFirstName()) .',</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr><td colspan="2">Please use the credentials below login to the Fluid Backend.</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr>';
                $body .= '    <td><b>URL: </b></td>';
                $body .= '    <td><a href="https://'. $_SERVER['HTTP_HOST'] .'/clinics/login">https://'. $_SERVER['HTTP_HOST'] .'/clinics/login</a></td>';
                $body .= '</tr>';
                $body .= '<tr>';
                $body .= '    <td><b>Username: </b></td>';
                $body .= '    <td>'. $this->encryptor->decrypt($clinicUsers->getEmail()) .'</td>';
                $body .= '</tr>';
                $body .= '<tr>';
                $body .= '    <td><b>Password: </b></td>';
                $body .= '    <td>'. $plainTextPwd .'</td>';
                $body .= '</tr>';
                $body .= '</table>';

                $email = (new Email())
                    ->from($this->getParameter('app.email_from'))
                    ->addTo($data->get('email'))
                    ->subject('Fluid Login Credentials')
                    ->html($body);

                $mailer->send($email);
            }

            $response = 'Your Fluid account was successfully created, an email with your login credentials has been sent to your inbox.';

        } else {

            $response = false;
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/register/check-email', name: 'clinic_check_email')]
    public function clinicsCheckEmailAction(Request $request): Response
    {
        $email = $request->request->get('email');
        $domainName = explode('@', $email);
        $response['response'] = true;
        $restrictedDomains = $this->em->getRepository(RestrictedDomains::class)->arrayFindAll();
        $firstName = '';

        foreach($restrictedDomains as $restrictedDomain)
        {
            if(md5($domainName[1]) == md5($restrictedDomain->getName()))
            {
                $response['response'] = false;
                $response['restricted'] = true;

                return new JsonResponse($response);
            }
        }

        $distributor = $this->em->getRepository(Distributors::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $distributorDomain = $this->em->getRepository(Distributors::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $distributorUsers = $this->em->getRepository(DistributorUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $clinic = $this->em->getRepository(Clinics::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $clinicDomain = $this->em->getRepository(Clinics::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $clinicUsers = $this->em->getRepository(ClinicUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        if($clinicDomain != null)
        {
            $user = $this->em->getRepository(ClinicUsers::class)->findOneBy([
                'clinic' => $clinicDomain->getId(),
                'isPrimary' => 1
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        if($distributorDomain != null)
        {
            $user = $this->em->getRepository(DistributorUsers::class)->findOneBy([
                'distributor' => $distributorDomain->getId(),
                'isPrimary' => 1
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        $response['firstName'] = $firstName;

        if($distributor != null || $distributorUsers != null || $clinic != null || $clinicUsers != null || $clinicDomain != null || $distributorDomain != null){

            $response['response'] = false;
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/update/personal-information', name: 'clinic_update_personal_information')]
    public function clinicsUpdatePersonalInformationAction(Request $request): Response
    {
        $data = $request->request;
        $username = $this->get('security.token_storage')->getToken()->getUser()->getUserIdentifier();
        $clinics = $this->em->getRepository(Clinics::class)->findOneBy(['email' => $username]);

        if($clinics != null) {

            $clinics->setFirstName($data->get('first_name'));
            $clinics->setLastName($data->get('last_name'));
            $clinics->setTelephone($data->get('telephone'));
            $clinics->setPosition($data->get('position'));

            $this->em->persist($clinics);
            $this->em->flush();

            $response = '<b><i class="fa-solid fa-circle-check"></i></i></b> Personal details successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        } else {

            $response = '<b><i class="fas fa-check-circle"></i> Personal details successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/update/company-information', name: 'clinic_update_company_information')]
    public function clinicsUpdateCompanyInformationAction(Request $request): Response
    {
        $data = $request->request->get('clinic_form');
        $username = $this->get('security.token_storage')->getToken()->getUser()->getClinic()->getEmail();
        $clinics = $this->em->getRepository(Clinics::class)->findOneBy(['email' => $username]);

        if($clinics != null) {

            $domainName = explode('@', $data['email']);

            $clinics->setClinicName($this->encryptor->encrypt($data['clinicName']));
            $clinics->setEmail($this->encryptor->encrypt($data['email']));
            $clinics->setDomainName(md5($domainName[1]));
            $clinics->setTelephone($this->encryptor->encrypt($data['telephone']));
            $clinics->setIsoCode($this->encryptor->encrypt($data['iso_code']));
            $clinics->setIntlCode($this->encryptor->encrypt($data['intl_code']));

            $this->em->persist($clinics);
            $this->em->flush();

            $response = '<b><i class="fa-solid fa-circle-check"></i></i></b> Company details successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        } else {

            $response = '<b><i class="fas fa-check-circle"></i> Personal details successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/get-company-information', name: 'get_company_information')]
    public function clinicsGetCompanyInformationAction(Request $request): Response
    {
        $species = $this->em->getRepository(Species::class)->findByNameAsc();
        $permissions = json_decode($request->get('permissions'), true);

        // Permissions
        if(!in_array(10, $permissions)){

            $response = '
            <div class="row mt-3 mt-md-5">
                <div class="col-12 text-center">
                    <i class="fa-solid fa-ban pe-2" style="font-size: 30vh; margin-bottom: 30px; color: #CCC;text-align: center"></i>
                </div>
            </div>
            <div class="row">
                <div class="col-12 text-center">
                    <h1>Access Denied</h1>

                        <p class="mt-4">
                            Your user account does not have permission to view the requested page.
                        </p>
                </div>
            </div>';

            return new JsonResponse($response);
        }

        $clinic = $this->getUser()->getClinic();

        $response = '
        <div class="row position-relative" id="account_settings">
            <div class="col-12 text-center pt-3 pb-3" id="order_header">
                <h4 class="text-primary text-truncate">Account & Settings</h4>
                <span class="mb-5 mt-2 text-center text-primary text-sm-start d-none d-sm-inline">
                    Clinic Information
                </span>
            </div>
            <form name="form_clinic_information" id="form_clinic_information" method="post">
                <input type="checkbox" name="call_back_form[contact_me_by_fax_only]" value="1" tabindex="-1" class="hidden" autocomplete="off">
        
                <div class="row pt-0 pt-sm-3 border-left border-right bg-light border-top">
        
                    <!-- Clinic name -->
                    <div class="col-12 col-sm-12 pt-3 pt-sm-0">
                        <label>
                            Clinic Name
                        </label>
                        <input 
                            type="text" 
                            name="clinic_form[clinicName]" 
                            id="clinic_name" 
                            class="form-control" 
                            placeholder="Clinic Name*"
                            value="'. $this->encryptor->decrypt($clinic->getClinicName()) .'"
                        >
                        <div class="hidden_msg" id="error_first_name">
                            Required Field
                        </div>
                    </div>
                </div>
        
                <div class="row pt-0 pt-sm-3 border-left border-right bg-light">
        
                    <!-- Email -->
                    <div class="col-12 col-sm-6 pt-3 pt-sm-0">
                        <label>
                            Clinic Email Address
                        </label>
                        <input 
                            type="text" 
                            name="clinic_form[email]" 
                            id="clinic_email" 
                            class="form-control" 
                            placeholder="Clinic Email*"
                            value="'. $this->encryptor->decrypt($clinic->getEmail()) .'"
                        >
                        <div class="hidden_msg" id="error_clinic_email">
                            Required Field
                        </div>
                    </div>
        
                    <!-- Telephone -->
                    <div class="col-12 col-sm-6 pt-3 pt-sm-0">
                        <label>Enter Your Telephone*</label>
                        <input 
                            type="hidden"
                            name="isocode" 
                            id="isocode" 
                            value="'. $this->encryptor->decrypt($clinic->getIsoCode()) .'"
                        >
                        <input 
                            type="hidden"
                            name="clinic_form[telephone]" 
                            id="clinic_telephone" 
                            value="'. $this->encryptor->decrypt($clinic->getTelephone()) .'"
                        >
                        <input 
                            type="text" 
                            name="mobile" 
                            id="mobile" 
                            name="mobile" 
                            class="form-control" 
                            placeholder="Telephone*"
                            value="'. $this->encryptor->decrypt($clinic->getTelephone()) .'"
                        >
                        <div class="hidden_msg" id="error_telephone">
                            Required Field
                        </div>
                    </div>
                </div>
        
                <div class="row pt-3 pb-3 border-left border-right border-bottom bg-light">
        
                    <label class="mb-4 d-block">
                        Select All Species Treated By Your Practice
                    </label>';

                    foreach($species as $specie)
                    {
                        $response .= '
                        <!-- '. $specie->getName() .' -->
                        <div class="col-6 col-sm-4 col-md-2 text-center">
                            <div class="custom-control custom-checkbox image-checkbox" style="position: relative">
                                <input type="checkbox" class="custom-control-input species-checkbox" id="species_'. strtolower($specie->getName()) .'">
                                <label class="custom-control-label" for="species_'. strtolower($specie->getName()) .'">
                                    <i class="'. $specie->getIcon() .' species-icon" id="icon_'. strtolower($specie->getName()) .'"></i>
                                </label>
                            </div>
                        </div>';
                    }

                $response .= '
                </div>
        
                <div class="row mb-3">
                    <div class="col-12 mt-2 mb-5 ps-0 pe-0">
                        <button id="btn_personal_information" type="submit" class="btn btn-primary w-100">UPDATE CLINIC INFORMATION</button>
                    </div>
                </div>
            </form>
        </div>';

        return new JsonResponse($response);
    }

    #[Route('/clinics/addresse-refresh', name: 'clinic_refresh_addresses')]
    public function clinicRefreshAddressesAction(Request $request): Response
    {
        $clinicId = $this->get('security.token_storage')->getToken()->getUser()->getClinic()->getId();
        $methods = $this->em->getRepository(Clinics::class)->getClinicAddresses($clinicId);

        $html = '';

        foreach($methods[0]->getAddresses() as $address){

            $class = 'address-icon';

            if($address->getIsDefault() == 1){

                $class = 'is-default-address-icon';
            }

            $html .= '<div class="row t-row">
                    <div class="col-md-10" id="string_address_clinic_name_'. $address->getId() .'">
                        <div class="row">
                            <div class="col-md-2 t-cell text-truncate" id="string_address_clinic_name_'. $address->getId() .'">
                                '. $address->getClinicName() .'
                            </div>
                            <div class="col-md-2 t-cell text-truncate" id="string_address_telephone_'. $address->getId() .'">
                                '. $address->getTelephone() .'
                            </div>
                            <div class="col-md-4 t-cell text-truncate" id="string_address_address_'. $address->getId() .'">
                                '. $address->getAddress() .'
                            </div>
                            <div class="col-md-2 t-cell text-truncate" id="string_address_city_'. $address->getId() .'">
                                '. $address->getCity() .'
                            </div>
                            <div class="col-md-2 t-cell text-truncate" id="string_address_state_'. $address->getId() .'">
                                '. $address->getState() .'
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2" id="string_address_postal)_code'. $address->getId() .'">
                        <div class="row">
                            <div class="col-md-4 t-cell text-truncate" id="string_address_postal_code'. $address->getId() .'">
                                '. $address->getPostalCode() .'
                            </div>
                            <div class="col-md-8 t-cell">
                                <a href="" class="float-end" data-bs-toggle="modal" data-bs-target="#modal_address" id="address_update_'. $address->getId() .'">
                                    <i class="fa-solid fa-pen-to-square edit-icon"></i>
                                </a>
                                <a href="" class="delete-icon float-end" data-bs-toggle="modal" data-value="'. $address->getId() .'" data-bs-target="#modal_address_delete" id="address_delete_'. $address->getId() .'">
                                    <i class="fa-solid fa-trash-can"></i>
                                </a>
                                <a href="#" id="address_default_'. $address->getId() .'">
                                    <i class="fa-solid fa-star float-end '. $class.'"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>';
        }

        return new JsonResponse($html);
    }

    #[Route('/clinics/communication-refresh', name: 'clinic_refresh_communication')]
    public function clinicRefreshCommunicationMethodsAction(Request $request): Response
    {
        $clinicId = $this->get('security.token_storage')->getToken()->getUser()->getClinic()->getId();
        $methods = $this->em->getRepository(Clinics::class)->getClinicCommunicationMethods($clinicId);

        $html = '';
        //dd($methods[0]->getClinicCommunicationMethods());
        foreach($methods[0]->getClinicCommunicationMethods() as $method){

            $html .= '
            <div class="row t-row">
                <div class="col-md-4 t-cell text-truncate" id="">
                    '. $method->getCommunicationMethod()->getMethod() .'
                </div>
                <div class="col-md-4 t-cell text-truncate" id="">
                    '. $method->getSendTo() .'
                </div>
                <div class="col-md-4 t-cell text-truncate" id="">
                    <a href="" class="float-end" data-bs-toggle="modal" data-bs-target="#modal_communication_methods" id="communication_method_update_'. $method->getId() .'">
                        <i class="fa-solid fa-pen-to-square edit-icon"></i>
                    </a>
                    <a href="" class="delete-icon float-end" data-bs-toggle="modal" data-value="'. $method->getId() .'" data-bs-target="#modal_method_delete" id="method_delete_'. $method->getId() .'">
                        <i class="fa-solid fa-trash-can"></i>
                    </a>
                </div>
            </div>';
        }

        return new JsonResponse($html);
    }

    #[Route('/clinics/error', name: 'clinic_error_500')]
    public function clinic500ErrorAction(Request $request): Response
    {
        $username = $this->getUser();
        $id = '';

        if($username != null) {

            $id = $this->getUser()->getClinic()->getId();
        }

        return $this->render('bundles/TwigBundle/Exception/error500.html.twig', [
            'type' => 'clinics',
            'id' => $id,
        ]);
    }

    private function generatePassword()
    {
        $sets = [];
        $sets[] = 'abcdefghjkmnpqrstuvwxyz';
        $sets[] = 'ABCDEFGHJKMNPQRSTUVWXYZ';
        $sets[] = '23456789';
        $sets[] = '!@$%*?';

        $all = '';
        $password = '';

        foreach ($sets as $set) {

            $password .= $set[array_rand(str_split($set))];
            $all .= $set;
        }

        $all = str_split($all);

        for ($i = 0; $i < 16 - count($sets); $i++) {

            $password .= $all[array_rand($all)];
        }

        $this->plainPassword = str_shuffle($password);

        return $this->plainPassword;
    }
}
